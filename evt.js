const EVT_FUNCTION_ACTION_NAME_TO_FUNCTION = {
    'today': (req, res) => {
        console.log("Event Today reached");
        var request = require("request");

        var options = {
            method: 'GET',
            url: 'https://cors-anywhere.herokuapp.com/https://clients6.google.com/calendar/v3/calendars/indark@lehigh.edu/events',
            qs:
                {
                    calendarId: 'indark%40lehigh.edu',
                    singleEvents: 'true',
                    timeZone: 'America%2FNew_York',
                    maxAttendees: '1',
                    maxResults: '250',
                    sanitizeHtml: 'true',
                    timeMin: '2018-04-06T00%3A00%3A00-04%3A00',
                    timeMax: '2018-05-15T00%3A00%3A00-04%3A00',
                    key: 'AIzaSyBNlYH01_9Hc5S1J9vuFmu2nUqBZJNAXxs'
                },
            headers:
                {
                    'Postman-Token': 'eb2bd4a0-d9d7-4c74-8b17-c953a8673a99',
                    'Cache-Control': 'no-cache',
                    Origin: ''
                }
        };

        request(options, function (error, response, body) {
            if (error) throw new Error(error);

            console.log(body);
        });


        res.json({
            fulfillment_text: 'The calendar request was successful!'
        });
    },
};

module.exports = EVT_FUNCTION_ACTION_NAME_TO_FUNCTION;
