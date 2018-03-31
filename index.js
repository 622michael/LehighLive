const express = require("express");
const app = express();

const bodyParser = require("body-parser");
const request = require("request");

app.use(
  bodyParser.urlencoded({
    extended: true
  })
);

app.use(bodyParser.json());


var busModule = require("./bus")

var modules = {
    "BUS": busModule
}

function send404(res) {
    res.status(404)
    res.send("")
}

app.post("/", function(req, res) {
    var action = req.body.queryResult.action

    if (action.length < 4) {
        send404(res)
    } else {
        var module = action.substring(0, 3);
        var func = action.substring(3);

        if (modules[module] && modules[module][func]) {
            modules[module][func](req, res)
        } else {
            send404(res)
        }
    }

});

var port = process.env.PORT || 3000
app.listen(port, function() {
  console.log("Server up and listening at " + port + "!");
});