///////////////// SERVER SETUP, MODULES AND MIDDLEWARE

const express = require("express");
const app = express();

const db = require("./db");
const bcrypt = require("./bcrypt");
const redis = require("./redis");

// handlebars
var hb = require("express-handlebars");
app.engine("handlebars", hb());
app.set("view engine", "handlebars");

// bodyparser, csurf and redis
const bodyParser = require("body-parser");
const csurf = require("csurf");

var session = require("express-session");
var Store = require("connect-redis")(session);

app.use(
    session({
        store: new Store({
            ttl: 3600,
            host: "localhost",
            port: 6379
        }),
        resave: false,
        saveUninitialized: true,
        secret: "my super fun secret"
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

// serving static files from public dir
app.use(express.static(__dirname + "/public"));

// redirecting depending on session cookies
app.use(function(req, res, next) {
    if (
        !req.session.userId &&
        req.url !== "/login" &&
        req.url !== "/register"
    ) {
        res.redirect("/register");
    } else {
        next();
    }
});

function redirectLoggedInUsers(req, res, next) {
    if (req.session.userId) {
        res.redirect("/petition");
    } else {
        next();
    }
}

function redirectSigners(req, res, next) {
    if (req.session.signatureId) {
        res.redirect("/thanks");
    } else {
        next();
    }
}

function redirectNonSigners(req, res, next) {
    if (!req.session.signatureId) {
        res.redirect("/petition");
    } else {
        next();
    }
}

// delete redis cache

function deleteRedisCache() {
    redis
        .get("signersList")
        .then(function() {
            redis.del("signersList");
        })
        .catch(function(err) {
            console.log("Error in delete redis cache in POST petition: ", err);
        });
}

/////////////// ROUTES

app.get("/", (req, res) => {
    res.redirect("/register");
});

// --- register & login

app.get("/register", redirectLoggedInUsers, (req, res) => {
    res.render("register", {
        layout: "main"
    });
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

app.get("/login", redirectLoggedInUsers, (req, res) => {
    res.render("login", {
        layout: "main"
    });
});

// 1) checking if email is already registered in the database (if not: an error message is rendered)
// 2) checking if the password is correct by comparing the user input with the password stored in the database
// -- if yes (passwords do match): set session cookies and redirect the user based on whether he*she has signed the petition
// -- if no (passwords do not match): render error message
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
                })
                .catch(function(err) {
                    console.log(err);
                    res.render("login", {
                        layout: "main",
                        err: err
                    });
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

// --- additional profile information

app.get("/profile", (req, res) => {
    res.render("profile", {
        layout: "loggedin"
    });
});

app.post("/profile", (req, res) => {
    let { age, city, url } = req.body;

    if (age != null || city != null || url != null) {
        var httpUrl = "";
        if (url !== "" && !url.startsWith("http") && !url.startsWith("https")) {
            httpUrl = "http://" + url;
        } else {
            httpUrl = url;
        }
        db.addInfo(age, city, httpUrl, req.session.userId)
            .then(function(results) {
                req.session.age = results[0].age;
                req.session.city = results[0].city;
                req.session.url = httpUrl;
                res.redirect("/petition");
            })
            .catch(function(err) {
                console.log(err);
                res.render("profile", {
                    layout: "loggedin",
                    err: err
                });
            });
    } else {
        res.redirect("/petition");
    }
});

app.get("/profile/edit", (req, res) => {
    db.getProfile(req.session.userId)
        .then(function(results) {
            const updateProfileArray = results;
            res.render("editprofile", {
                layout: "loggedin",
                prepopulateForm: updateProfileArray
            });
        })
        .catch(function(err) {
            console.log(err);
            res.render("editprofile", {
                layout: "loggedin",
                err: err
            });
        });
});
//
app.post("/profile/edit", (req, res) => {
    let { first, last, email, pass, age, city, url } = req.body;

    var httpUrl = "";
    if (url !== "" && !url.startsWith("http") && !url.startsWith("https")) {
        httpUrl = "http://" + url;
    } else {
        httpUrl = url;
    }

    if (pass != "") {
        bcrypt
            .hash(pass)
            .then(hash => {
                Promise.all([
                    db.updateUserAndPassword(
                        req.session.userId,
                        first,
                        last,
                        email,
                        hash
                    ),
                    db.updateUserProfile(age, city, httpUrl, req.session.userId)
                ]);
            })
            .then(deleteRedisCache())
            .then(res.redirect("/petition"))
            .catch(function(err) {
                console.log("err in updating user profile and password: ", err);
                res.render("editprofile", {
                    layout: "loggedin",
                    err: err
                });
            });
    } else {
        Promise.all([
            db.updateUser(req.session.userId, first, last, email),
            db.updateUserProfile(age, city, httpUrl, req.session.userId)
        ])
            .then(deleteRedisCache())
            .then(res.redirect("/petition"))
            .catch(function(err) {
                console.log(
                    "err in updating user profile without password: ",
                    err
                );
                res.render("editprofile", {
                    layout: "loggedin",
                    err: err
                });
            });
    }
});

// --- signing the petition & 'thank you'-page

app.get("/petition", redirectSigners, (req, res) => {
    res.render("petition", {
        layout: "loggedin",
        first: req.session.first,
        last: req.session.last
    });
});

app.post("/petition", (req, res) => {
    db.sign(req.body.sig, req.session.userId)
        .then(function(results) {
            req.session.userId = results[0].user_id;
            req.session.signatureId = results[0].id;
            res.redirect("/thanks");
        })
        .then(deleteRedisCache())
        .catch(function(err) {
            console.log(err);
            res.render("petition", {
                layout: "loggedin",
                err: err
            });
        });
});

app.get("/thanks", redirectNonSigners, (req, res) => {
    Promise.all([db.countSigners(), db.getSignature(req.session.signatureId)])
        .then(function(results) {
            const numOfSigners = results[0][0].count;
            const userSignature = results[1][0].sig;
            res.render("thanks", {
                layout: "loggedin",
                name: req.session.first,
                signature: userSignature,
                numOfSigners: numOfSigners
            });
        })
        .catch(function(err) {
            console.log("Error in GET thanks: ", err);
        });
});

// --- list of signers

app.get("/signers", redirectNonSigners, (req, res) => {
    redis.get("signersList").then(data => {
        // if nothing is cached in redis
        if (!data) {
            console.log("nothing cached in redis");
            return db
                .getSigners()
                .then(results => {
                    var signersRedisData = JSON.stringify(results);
                    redis.setex("signersList", 3600, signersRedisData);
                    const arrayOfSigners = results;
                    res.render("signers", {
                        layout: "loggedin",
                        listOfSigners: arrayOfSigners
                    });
                })
                .catch(function(err) {
                    console.log(
                        "Error in GET signers / no data cached in redis: ",
                        err
                    );
                });
        }
        // if data is stored in redis cache => render it from there
        else {
            redis
                .get("signersList")
                .then(data => {
                    console.log("data cached in redis:", data);
                    const arrayOfSigners = JSON.parse(data);
                    res.render("signers", {
                        layout: "loggedin",
                        listOfSigners: arrayOfSigners
                    });
                })
                .catch(function(err) {
                    console.log("Error in GET signers: / redis cache ", err);
                });
        }
    });
});

app.get("/signers/:cities", redirectNonSigners, (req, res) => {
    db.getSignersbyCity(req.params.cities)
        .then(function(results) {
            const arrayOfSignersPerCity = results;
            res.render("signers", {
                layout: "loggedin",
                listOfSignersPerCity: arrayOfSignersPerCity
            });
        })
        .catch(function(err) {
            console.log("Error in GET /signers/:cities: ", err);
        });
});

// --- delete signature / delete account & logout

app.post("/sig/delete", (req, res) => {
    db.deleteSignature(req.session.userId)
        .then(function() {
            req.session.signatureId = null;
            res.redirect("/petition");
        })
        .then(deleteRedisCache())
        .catch(function(err) {
            console.log("Error in POST delete signature ", err);
        });
});

app.post("/user/delete", (req, res) => {
    Promise.all([
        db.deleteSignature(req.session.userId),
        db.deleteUserProfile(req.session.userId)
    ])
        .then(db.deleteUser(req.session.userId))
        .then(deleteRedisCache(), res.redirect("/logout"))
        .catch(function(err) {
            console.log("Error in POST delete user ", err);
        });
});

app.get("/logout", function(req, res) {
    req.session.destroy(function() {
        res.redirect("/register");
    });
});

app.listen(process.env.PORT || 8080, () => console.log("listening"));
