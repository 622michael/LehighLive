const express = require("express");
const app = express();

const bodyParser = require("body-parser");

app.use(
  bodyParser.urlencoded({
    extended: true
  })
);

app.use(bodyParser.json());


const busModule = require("./bus");

const modules = {
    "BUS": busModule
};

function send404(res) {
    res.status(404);
    res.send("Page not found");
}

app.post("/", function(req, res) {
    const action = req.body.queryResult.action;

    if (action.length < 4) {
        send404(res)
    } else {
        const module = action.substring(0, 3);
        const func = action.substring(3);

        if (modules[module] && modules[module][func]) {
            modules[module][func](req, res)
        } else {
            send404(res)
        }
    }

});

const port = process.env.PORT || 3000;
app.listen(port, function() {
  console.log("Server up and listening at " + port + "!");
});
