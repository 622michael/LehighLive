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
        url: url,
        qs: {format: 'json'},
        headers: {"origin": "Android", "User-Agent": "Android"}
    };
    request(options, function (error, response, body) {
        callback(error, response, body);
    });
}

const getTimeTable = (callback) => {
    // const testBody = require('./testdata/timetable');
    // callback(null, null, testBody);

    makeCORRequest(TimeTableURL, function(error, response, body) {
        callback(error, response, JSON.parse(body))
    });
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

function getArrival(timeTable, bus, dest) {
    const stops = timeTable[routeToKey[bus]]["stops"]

    for (var stop in stops) {
        const stopInfo = stops[stop]
        if (stopInfo.name == dest) {
            return stopInfo.arrival
        }
    }

    return false
}


const BUS_FUNCTION_ACTION_NAME_TO_FUNCTION = {
    'Location': (req, res) => {
        const app = new DialogflowApp({req, res});
        if (app.isPermissionGranted()) {
            app.tell("You have granted permission");
        } else {
            app.askForPermission('To locate you', app.SupportedPermissions.DEVICE_PRECISE_LOCATION);
        }
    },
    'Destination': (req, res) => {
        const bus = req.body.queryResult.parameters.bus;
        const dest = req.body.queryResult.parameters.destination;

        getTimeTable(function(error, response, timeTable) {
            var fullfillment = null
            if (error != null) {
                fullfillment = "I'm having trouble getting the bus routes at the moment. Please try again later."
            } 
            else {
                const arrival = getArrival(timeTable, bus, dest)
                switch(arrival) {
                    case false:
                        fullfillment = bus + " does not stop at " + dest
                        break;
                    case "Arriving Soon":
                        fullfillment = bus + " will be arriving soon."
                        break;
                    case "Just Departed":
                        fullfillment = bus + " just left " + dest
                        break;
                    case "At Stop":
                        fullfillment = bus + " is at " + dest
                        break;
                    case "-":
                        fullfillment = bus + " is not running"
                        break;
                    default:
                        fullfillment = bus + " arrives at " + arrival
                        break;
                }
            }
            res.json({
                fulfillment_text: fullfillment
            })
        })
    },
    'Test': (req, res) => {
        getBusData((busdata, error) => {
            let busName = req.body.queryResult.parameters.bus;
            let busCode = routeToKey[busName];
            console.log(busName);
            console.log(busCode);
            for (var i = 0; i <= busdata.length; i++) {
                console.log(busdata[i]);
            }
            const speech = busdata[1]['stops']['0'];

            //TODO Decide what bus data to provide based on what the user asks for, the busCode variable doesn't correspond
            //TODO to the index in busData
            console.log("Bus Code: " + busCode);
            let prettySpeech = "The " + busName + " " + speech;
            console.log(prettySpeech);
            console.log()
            res.json({
                fulfillment_text: prettySpeech
            });
        });
    },
    'from' :(req, res) => {
      res.json({
        fulfillment_text: "Bus from reached"
      });
    }
};

module.exports = BUS_FUNCTION_ACTION_NAME_TO_FUNCTION;
