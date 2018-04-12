const moment = require("moment");
const EVT_FUNCTION_ACTION_NAME_TO_FUNCTION = {
    'time': (req, res) => {
        console.log("Dining  reached");
        var request = require("request");

        var options = { method: 'GET',
            url: 'http://mc.lehigh.edu/services/dining/diningjson.html',
            headers:
                { 'Postman-Token': '0941584f-e6b8-471e-b562-bd3f487a71a9',
                    'Cache-Control': 'no-cache' } };

        request(options, function (error, response, body) {
            if (error) throw new Error(error);
            console.log(body);
        });

        res.json({
            fulfillment_text:  body
        })
    },
};

module.exports = EVT_FUNCTION_ACTION_NAME_TO_FUNCTION;
