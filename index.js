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


function getBusData(callback) {
	// The busdata request may respond with a blank JSON if no buses are running
	// For testing, we can use the testdata

	var testResponse = require("./testdata/busdata")
	callback(testResponse, null)

	// The real body fo this method

    // var options = {
    // method: 'GET',
    // url: 'https://cors-anywhere.herokuapp.com/http://bus.lehigh.edu/scripts/busdata.php?format=json',
    // qs: {format: 'json'},
    // headers:
    //     {
    //         'Postman-Token': 'b54f8a34-41f2-44e9-9925-bc453957485a',
    //         'Cache-Control': 'no-cache',
    //         'Origin':''
    //     }
    // };
    // request(options, function (error, response, body) {
    //     if (error) throw new Error(error);
    //     console.log(body);
    //     res.send(body);
    // });
}

function output(req, res) {
    getBusData(function(busdata, error) {
        var speech = busdata["1"]["stops"]["0"]
        res.json({
            fulfillment_text: speech
        })
    });

}

function departFrom(req, res) {
    res.json({
        fulfillment_text: "The location request was successful!"
    })

}

app.post("/", function(req, res) {
    console.log(req.body)
    var action = req.body.queryResult.action
    if (action == "Location") {
        departFrom(req, res)
    } else if (action == "Test") {
        output(req, res)
    } else {
        res.json({
            fulfillment_text: "That is not an action!"
        })
    }
});

var port = process.env.PORT || 3000
app.listen(port, function() {
  console.log("Server up and listening at " + port + "!");
});