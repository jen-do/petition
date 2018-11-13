///////////////// SERVER SETUP AND MODULES

const express = require("express");
const app = express();

const db = require("./db");
const bcrypt = require("./bcrypt");

// handlebars - do not touch this code
var hb = require("express-handlebars");
app.engine("handlebars", hb());
app.set("view engine", "handlebars");
// handlebars - do not touch this code

const cookieSession = require("cookie-session");
const bodyParser = require("body-parser");
const csurf = require("csurf");

app.use(
    cookieSession({
        secret: "nobody knows this secret but me",
        maxAge: 1000 * 60 * 60 * 24 * 7 * 6
    })
);

app.use(
    bodyParser.urlencoded({
        extended: false
    })
);

app.use(csurf());

app.use(function(req, res, next) {
    res.locals.csrfToken = req.csrfToken();
    next();
});

/////////////// PUBLIC DIR

app.use(express.static(__dirname + "/public"));

/////////////// ROUTES

app.get("/", function(req, res) {
    res.redirect("/register");
});

app.get("/register", (req, res) => {
    if (req.session.userId) {
        res.redirect("/petition");
    } else {
        res.render("register", {
            layout: "main"
        });
    }
});

app.post("/register", (req, res) => {
    bcrypt.hash(req.body.pass).then(hash => {
        db.register(req.body.first, req.body.last, req.body.email, hash)
            .then(function(results) {
                req.session.userId = results[0].id;
                req.session.first = results[0].first;
                req.session.last = results[0].last;
                res.redirect("/profile");
            })
            .catch(function(err) {
                console.log("Error in POST /register: ", err);
                res.render("register", {
                    layout: "main",
                    err: err
                });
            });
    });
});

app.get("/profile", (req, res) => {
    res.render("profile", {
        layout: "main"
    });
});

app.post("/profile", (req, res) => {
    if (req.body.age != null || req.body.city != null || req.body.url != null) {
        var httpUrl = "";
        if (
            !req.body.url.startsWith("http") ||
            !req.body.url.startsWith("https")
        ) {
            httpUrl = "http://" + req.body.url;
            console.log("no http");
        } else {
            httpUrl = req.body.url;
            console.log("http");
        }
        db.addInfo(
            req.body.age,
            req.body.city,
            httpUrl,
            // req.body.url,
            req.session.userId
        )
            .then(function(results) {
                req.session.age = results[0].age;
                req.session.city = results[0].city;
                req.session.url = httpUrl;
                res.redirect("/petition");
            })
            .catch(function(err) {
                console.log(err);
                res.render("profile", {
                    layout: "main",
                    err: err
                });
            });
    } else {
        res.redirect("/petition");
    }
});

app.get("/login", (req, res) => {
    if (req.session.userId) {
        res.redirect("/petition");
    } else {
        res.render("login", {
            layout: "main"
        });
    }
});

app.post("/login", (req, res) => {
    db.login(req.body.email)
        .then(function(results) {
            if (results.length == 0) {
                throw new Error("no valid email address");
            }
            bcrypt
                .compare(req.body.pass, results[0].pass)
                .then(function(matches) {
                    if (matches && results[0].signatures_id) {
                        req.session.signatureId = results[0].signatures_id;
                        req.session.userId = results[0].user_id;
                        req.session.first = results[0].first;
                        req.session.last = results[0].last;
                        res.redirect("/thanks");
                    } else if (matches && !results[0].signatures_id) {
                        req.session.userId = results[0].user_id;
                        req.session.first = results[0].first;
                        req.session.last = results[0].last;
                        res.redirect("/petition");
                    } else {
                        throw new Error("no matches");
                    }
                });
        })
        .catch(function(err) {
            console.log(err);
            res.render("login", {
                layout: "main",
                err: err
            });
        });
});

app.get("/profile/edit", (req, res) => {
    console.log("session usedId: ", req.session.userId);
    db.getProfile(req.session.userId)
        .then(function(results) {
            const updateProfileArray = results;
            console.log("updateProfileArray:", updateProfileArray);
            res.render("editprofile", {
                layout: "main",
                prepopulateForm: updateProfileArray
            });
        })
        .catch(function(err) {
            console.log(err);
            res.render("editprofile", {
                layout: "main",
                err: err
            });
        });
});
//
app.post("/profile/edit", (req, res) => {
    console.log("req.body: ", req.body);
    if (req.body.pass != "") {
        // console.log("post on /profile/edit");
        bcrypt
            .hash(req.body.pass)
            .then(hash => {
                db.updateUserAndPassword(
                    req.session.userId,
                    req.body.first,
                    req.body.last,
                    req.body.email,
                    hash
                );
            })
            .catch(function(err) {
                console.log("err in UpdateUserandPass: ", err);
                res.render("editprofile", {
                    layout: "main",
                    err: err
                });
            });
    } else {
        db.updateUser(
            req.session.userId,
            req.body.first,
            req.body.last,
            req.body.email
        ).catch(function(err) {
            console.log("err in updateUser: ", err);
            res.render("editprofile", {
                layout: "main",
                err: err
            });
        });
    }
    var httpUrl = "";
    if (!req.body.url.startsWith("http") && !req.body.url.startsWith("https")) {
        httpUrl = "http://" + req.body.url;
        console.log("no http");
    } else {
        httpUrl = req.body.url;
        console.log("http");
    }

    db.updateUserProfile(
        req.body.age,
        req.body.city,
        httpUrl,
        // req.body.url,
        req.session.userId
    )
        .then(function() {
            res.redirect("/petition");
        })
        .catch(function(err) {
            console.log("updateUserProfile err: ", err);
            res.render("editprofile", {
                layout: "main",
                err: err
            });
        });
});

app.get("/petition", (req, res) => {
    if (req.session.signatureId) {
        res.redirect("/thanks");
    } else {
        res.render("petition", {
            layout: "main",
            first: req.session.first,
            last: req.session.last
        });
    }
});

app.post("/petition", (req, res) => {
    db.sign(req.body.sig, req.session.userId)
        .then(function(results) {
            req.session.userId = results[0].user_id;
            req.session.signatureId = results[0].id;
            res.redirect("/thanks");
        })

        .catch(function(err) {
            console.log(err);
            res.render("petition", {
                layout: "main",
                err: err
            });
        });
});

app.get("/thanks", (req, res) => {
    // console.log(req.session);
    if (req.session.signatureId) {
        Promise.all([
            db.countSigners(),
            db.getSignature(req.session.signatureId)
        ])
            .then(function(results) {
                const numOfSigners = results[0][0].count;
                const userSignature = results[1][0].sig;
                // console.log("number of signers: ", numOfSigners);
                res.render("thanks", {
                    layout: "main",
                    name: req.session.first,
                    signature: userSignature,
                    numOfSigners: numOfSigners
                });
            })
            .catch(function(err) {
                console.log("Error in GET thanks: ", err);
            });
    } else {
        res.redirect("/petition");
    }
});

app.get("/signers", (req, res) => {
    if (req.session.signatureId) {
        db.getSigners()
            .then(function(results) {
                const arrayOfSigners = results;
                console.log("arrayOfSigners: ", arrayOfSigners);
                res.render("signers", {
                    layout: "main",
                    listOfSigners: arrayOfSigners
                });
            })
            .catch(function(err) {
                console.log("Error in GET signers: ", err);
            });
    } else {
        res.redirect("/petition");
    }
});

app.get("/signers/:cities", (req, res) => {
    db.getSignersbyCity(req.params.cities)
        .then(function(results) {
            const arrayOfSignersPerCity = results;
            console.log(arrayOfSignersPerCity);
            res.render("signers", {
                layout: "main",
                listOfSigners: arrayOfSignersPerCity
            });
        })
        .catch(function(err) {
            console.log("Error in GET /signers/:cities: ", err);
        });
});

app.post("/sig/delete", (req, res) => {
    console.log("delete signature");
    db.deleteSignature(req.session.userId)
        .then(function() {
            req.session.signatureId = null;
            // console.log(results);
            res.redirect("/petition");
        })
        .catch(function(err) {
            console.log("Error in POST delete signature ", err);
        });
});

// app.post("/user/delete", (req, res) => {
//     console.log("delete user");
// });

app.get("/logout", function(req, res) {
    req.session = null;
    res.redirect("/register");
});

app.listen(8080, () => console.log("listening"));
