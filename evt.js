const EVT_FUNCTION_ACTION_NAME_TO_FUNCTION = {
    'today': (req, res) => {
        console.log("Event Today reached");
        var unirest = require("unirest");

        var req = unirest("GET", "https://clients6.google.com/calendar/v3/calendars/indark@lehigh.edu/events?calendarId=indark%40lehigh.edu&singleEvents=true&timeZone=America%2FNew_York&maxAttendees=1&maxResults=250&sanitizeHtml=true&timeMin=2018-04-06T00%3A00%3A00-04%3A00&timeMax=2018-05-15T00%3A00%3A00-04%3A00&key=AIzaSyBNlYH01_9Hc5S1J9vuFmu2nUqBZJNAXxs");
        
        req.headers({
            "Cache-Control": "no-cache"
        });

        req.end(function (res) {
            if (res.error) throw new Error(res.error);
            console.log(res.body);
        });

        res.json({
            fulfillment_text: 'The calendar request was successful!'
        });
    },
};

module.exports = EVT_FUNCTION_ACTION_NAME_TO_FUNCTION;
