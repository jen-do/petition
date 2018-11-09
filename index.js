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
    res.render("register", {
        layout: "main"
    });
});

app.post("/register", (req, res) => {
    bcrypt.hash(req.body.pass).then(hash => {
        console.log(hash);
        db.register(req.body.first, req.body.last, req.body.email, hash)
            .then(function(results) {
                console.log(results);
                const firstname = results[0].first;
                const lastname = results[0].last;
                const userId = results[0].id;

                req.session.userId = userId;
                req.session.first = firstname;
                req.session.last = lastname;
            })
            .then(function() {
                res.redirect("/petition");
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

app.get("/login", (req, res) => {
    res.render("login", {
        layout: "main"
    });
});

app.post("/login", (req, res) => {
    db.login(req.body.email)
        .then(function(results) {
            console.log(results);
            if (results.length == 0) {
                throw new Error("no valid email address");
            }
            bcrypt
                .compare(req.body.pass, results[0].pass)
                .then(function(matches) {
                    if (matches) {
                        console.log(matches);
                        // console.log(req.session, req.body);
                        req.session.userId = results[0].id;
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

app.get("/petition", (req, res) => {
    if (!req.session.userId) {
        res.redirect("/register");
    }
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
    db.sign(req.body.first, req.body.last, req.body.sig, req.session.userId)
        .then(function(results) {
            req.session.userId = results[0].user_id;
            req.session.signatureId = results[0].id;
            req.session.first = results[0].first;
        })
        .then(function() {
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
        db.getSignature(req.session.signatureId).then(function(results) {
            const usersSignature = results[0].sig;

            res.render("thanks", {
                layout: "main",
                name: req.session.first,
                signature: usersSignature,
                numberOfSignatures: req.session.signatureId
            });
        });
    } else {
        res.redirect("/petition");
    }
});

app.get("/signers", (req, res) => {
    if (req.session.signatureId) {
        db.getSigners()
            .then(function(results) {
                // console.log(results);
                const arrayOfSignersNames = results;
                console.log(arrayOfSignersNames);
                res.render("signers", {
                    layout: "main",
                    listOfSigners: arrayOfSignersNames
                });
            })
            .catch(function(err) {
                console.log("Error in GET signers: ", err);
            });
    } else {
        res.redirect("/petition");
    }
});

app.listen(8080, () => console.log("listening"));
