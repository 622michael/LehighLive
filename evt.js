
const EVT_FUNCTION_ACTION_NAME_TO_FUNCTION = {
    'today': (req, res) => {
        console.log("Event Today reached");
        var unirest = require("unirest");

        var req = unirest("GET", "https://clients6.google.com/calendar/v3/calendars/indark@lehigh.edu/events?calendarId=indark%40lehigh.edu&singleEvents=true&timeZone=America%2FNew_York&maxAttendees=1&maxResults=250&sanitizeHtml=true&timeMin=2018-04-06T00%3A00%3A00-04%3A00&timeMax=2018-05-15T00%3A00%3A00-04%3A00&key=AIzaSyBNlYH01_9Hc5S1J9vuFmu2nUqBZJNAXxs");

        req.headers({
            "Cache-Control": "no-cache"
        });

        req.end(function (res) {
            var moment = require("moment");
            if (res.error) throw new Error(res.error);
            console.log(res.body);
            var events = new Array();
            var threeDay = new Array();
            console.log(moment(Date.now()));
            threeDaysFromNow = moment(Date.now()).add(4,'d');
            aWeekFromNow = moment(Date.now()).add(7,'d');
            for (var i =0; i < res.body.items.length;i++){
                var dateTime = res.body.items[i].start.dateTime;
                var eventName = res.body.items[i].summary;
                console.log('moment : ' + moment(dateTime).fromNow() + " " + moment(dateTime).isAfter(Date.now()) + " " + moment(dateTime).isBefore(threeDaysFromNow));
                if(moment(dateTime).isAfter(Date.now())) {
                    events[i] = {"dateTime": dateTime};
                    if (moment(dateTime).isBefore(threeDaysFromNow)) {
                        let eventTimeFromNow = moment(dateTime).fromNow();
                        threeDay[i] = {"dateTime": eventTimeFromNow, "event":eventName};
                    }

                }
            }
            console.log("EVENTS ARRAY");
            console.log(events);
            console.log("3 DAY ARRAY");
            console.log(threeDay);
        });

        res.json({
            fulfillment_text: 'The calendar request was successful!'
        });
    },
};

module.exports = EVT_FUNCTION_ACTION_NAME_TO_FUNCTION;
