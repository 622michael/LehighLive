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
