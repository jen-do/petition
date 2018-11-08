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

app.use(require("cookie-parser")());

/////////////// PUBLIC DIR

app.use(express.static(__dirname + "/public"));

/////////////// ROUTES

app.get("/", (req, res) => {
    res.render("petition", {
        layout: "main"
    });
});

app.post("/", (req, res) => {
    console.log(req.body);
    db.sign(req.body.first, req.body.last, req.body.sig)
        .then(function() {
            // console.log(req.body);
            res.redirect("/thanks");
        })
        .catch(function(err) {
            console.log(err);
            res.render("petition", {
                layout: "main",
                error: "An error occured."
            });
        });
});

app.get("/thanks", (req, res) => {
    res.render("thanks", {
        layout: "main"
    });
});

app.listen(8080, () => console.log("listening"));
