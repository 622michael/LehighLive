const request = require('request');

const routeToKey = {
  "Mountaintop Express": '1',
  "Saucon Village": '2',
  "T.R.A.C.S.": '3',
  "Athletics": '4',
  "Packer Express": '10',
  "Campus Connector": '11'
};

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
    res.json({
      fulfillment_text: 'The location request was successful!'
    });
  },
  'Test': (req, res) => {
    getBusData((busdata, error) => {
      console.dir(req);
        let busName = req.body.queryResult.parameters.bus;
        let busCode = routeToKey[busName];
        console.log(busName);
      const speech = busdata[busCode]['stops']['0'];
      console.log("Bus Code: " + busCode);
      console.log("The " + busName + " " + speech);

        res.json({
        fulfillment_text: speech
      });
    });
  }
};

module.exports = BUS_FUNCTION_ACTION_NAME_TO_FUNCTION;
