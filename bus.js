const request = require('request');

const routeToKey = {
    "Mountaintop Express": '1',
    "Saucon Village": '2',
    "T.R.A.C.S.": '3',
    "TRACS": '3',
    "Athletics": '4',
    "Packer Express": '10',
    "Campus Connector": '11'
};

const BusDataURL = "http://bus.lehigh.edu/scripts/busdata.php?format=json"
const TimeTableURL = "http://buses.lehigh.edu/scripts/routestoptimes.php?format=json"

const DialogflowApp = require('actions-on-google').DialogflowApp;

const makeCORRequest = (url, callback) => {
    var options = {
        method: 'GET',
        url: 'https://cors-anywhere.herokuapp.com/' + url,
        qs: {format: 'json'}
    };
    request(options, function (error, response, body) {
        callback(error, response, body);
    });
}

const getTiemTable = (callback) => {
    const testBody = require('./testdata/timetable');
    callback(null, null, testBody);

    // makeCORRequest(TimeTableURL, callback);
}

const getBusData = (callback) => {
    // The busdata request may respond with a blank JSON if no buses are running
    // For testing, we can use the testdata

    const testResponse = require('./testdata/busdata');
    callback(testResponse, null);

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
};


const BUS_FUNCTION_ACTION_NAME_TO_FUNCTION = {
    'Location': (req, res) => {
        console.log(req.body)
        const app = new DialogflowApp({req, res});
        if (app.isPermissionGranted()) {
            app.tell("You have granted permission");
        } else {
            app.askForPermission('To locate you', app.SupportedPermissions.DEVICE_PRECISE_LOCATION);
        }
    },
    'Desitination': (req, res) => {
        const bus = req.body.queryResult.parameters.bus;
        const dest = req.body.queryResult.parameters.destination;

        getTiemTable(function(error, response, timeTable) {
            if (error != null) {
                res.json({
                    fulfillment_text: "I'm having trouble getting the bus routes at the moment. Please try again later."
                })
            } else {
                const stops = timeTable[routeToKey[bus]]
                var found = false
                for  (var stop in stops) {
                    const stopInfo = stops[stop]
                    if (stopInfo.name == dest) {
                        found = true

                        if (stopInfo.arrival == "Arriving Soon") {
                            res.json({
                                fulfillment_text: bus + " will be arriving soon."
                            })
                        } else if (stopInfo.arrival == "Just Departed") {
                            // We should find the next one

                            res.json({
                                fulfillment_text: bus + " just left " + dest
                            })
                        } else {
                            res.json({
                                fulfillment_text: bus + " arrives at " + stopInfo.arrival
                            })
                        }
                    }
                }

                if (!found) {
                    res.json({
                        fulfillment_text: bus + " does not stop at " + dest
                    })
                }
            }
        })
    },
    'Test': (req, res) => {
        getBusData((busdata, error) => {
            console.dir(req);
            let busName = req.body.queryResult.parameters.bus;
            let busCode = routeToKey[busName];
            console.log(busName);
            console.log(busCode);
            for (var i = 0; i <= busdata.length; i++) {
                console.log(busdata[i]['name']);
            }
            const speech = busdata[1]['stops']['0'];
            //TODO Decide what bus data to provide based on what the user asks for, the busCode variable doesn't correspond
            //TODO to the index in busData
            console.log("Bus Code: " + busCode);
            let prettySpeech = "The " + busName + " " + speech;
            console.log(prettySpeech);

            res.json({
                fulfillment_text: prettySpeech
            });
        });
    }
};

module.exports = BUS_FUNCTION_ACTION_NAME_TO_FUNCTION;
