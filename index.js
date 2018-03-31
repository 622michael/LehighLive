const express = require("express")
const bodyParser = require("body-parser")
const request = require("request")

bodyParser.use(
  bodyParser.urlencoded({
    extended: true
  })
);

bodyParser.use(bodyParser.json());


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

express.post("/bus", function(req, res) {
	var data = getBusData(function(busdata, error) {
		var speech = busdata["1"]["stops"]["0"]
		res.json({
			speech: speech,
			displayText: speech,
			source: "lehighlive"
		})
	})

});