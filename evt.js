const request = require('request');

const EVT_FUNCTION_ACTION_NAME_TO_FUNCTION = {
    'today': (req, res) => {
        res.json({
            fulfillment_text: 'The calendar request was successful!'
        });
    },
};

module.exports = BUS_FUNCTION_ACTION_NAME_TO_FUNCTION;
