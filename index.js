///////////////// SERVER SETUP AND MODULES

const express = require("express");
const app = express();

const db = require("./db");

// handlebars - do not touch this code
var hb = require("express-handlebars");
app.engine("handlebars", hb());
app.set("view engine", "handlebars");
// handlebars - do not touch this code

app.use(
    require("body-parser").urlencoded({
        extended: false
    })
);

// app.use(require("cookie-parser")());

var cookieSession = require("cookie-session");

app.use(
    cookieSession({
        secret: `I'm always angry.`,
        maxAge: 1000 * 60 * 60 * 24 * 14
    })
);

/////////////// PUBLIC DIR

app.use(express.static(__dirname + "/public"));

/////////////// ROUTES

app.get("/", (req, res) => {
    if (req.session.signatureId) {
        res.redirect("/thanks");
    } else {
        res.render("petition", {
            layout: "main"
        });
    }
});

app.post("/", (req, res) => {
    db.sign(req.body.first, req.body.last, req.body.sig)
        .then(function(results) {
            const userId = results[0].id;
            const firstname = results[0].first;
            // console.log(req.session);
            // console.log(userId);
            req.session.signatureId = userId;
            console.log(userId);
            req.session.first = firstname;
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
        res.redirect("/");
    }
});

app.get("/signers", (req, res) => {
    db.getSigners().then(function(results) {
        console.log(results);
        res.render("signers", {
            layout: "main"
        });
    });
});

app.listen(8080, () => console.log("listening"));
