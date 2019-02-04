var canvas = document.getElementById("canv");
var ctx = canvas.getContext("2d");
var mousemove;

canvas.addEventListener("mousedown", function(e) {
    var x = e.offsetX;
    var y = e.offsetY;
    // console.log(x, y);
    ctx.strokeStyle = "#144c52";

    ctx.moveTo(x, y);

    canvas.addEventListener(
        "mousemove",
        (mousemove = function(e) {
            // console.log(x, y);
            var newX = e.offsetX;
            var newY = e.offsetY;
            ctx.lineTo(newX, newY);
            ctx.stroke();
        })
    );
});

document.addEventListener("mouseup", function() {
    canvas.removeEventListener("mousemove", mousemove);
    let hiddenField = document.getElementById("hidden");
    hiddenField.value = "";
    hiddenField.value += canvas.toDataURL();
});

function toggleNav() {
    var nav = document.getElementById("menu");
    if (nav.className === "topnav") {
        nav.className += " responsive";
    } else {
        nav.className = "topnav";
    }
}

toggleNav();
