const request = require('request');

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
      const speech = busdata['1']['stops']['0'];
      res.json({
        fulfillment_text: speech
      });
    });
  }
};

module.exports = BUS_FUNCTION_ACTION_NAME_TO_FUNCTION;
