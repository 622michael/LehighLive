const unirest = require("unirest");
const moment = require("moment");
const EVT_FUNCTION_ACTION_NAME_TO_FUNCTION = {
    'time': (req, res) => {
        console.log("Dining  reached");
        res.json({
            fulfillment_text: "Dining reached"
        })
    },
};

module.exports = EVT_FUNCTION_ACTION_NAME_TO_FUNCTION;
