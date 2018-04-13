const moment = require('moment');
// DINtime
// What's open now?
const HOURS_IN_DAY = 24;
const map = {
    'Sun': 0,
    'Mon': 1,
    'Tue': 2,
    'Wed': 3,
    'Thu': 4,
    'Thurs': 4,
    'Fri': 5,
    'Sat': 6
};

const json = require('./testdata/formatLocations');
const allLocations = json.locations.category.map(element => {
    return element.location
}).reduce((acc, val) => acc.concat(val), []);

const getAllLocations = () => {
    return allLocations;
};

const getHourFromTimeString = (hour) => {
    if(hour === "12:00am") return 0;
    if(hour === "12:00pm") return 12;
    else return hour.includes("am") ? parseInt(hour.replace('am')) : parseInt(hour.replace('pm')) + 12;
};

const getMinutesFromTimeString = (time) => {
    return parseInt(time.replace(/am|pm/g,'').split(':')[1])
};

const getCurrentHour = () => new Date().getHours();
const getCurrentDay = () => new Date().getDay();

const isAm = (hour) => hour.includes("am");
const isPm = (hour) => hour.includes("pm");

const makeDate = (hour, minutes) => {
    const date = new Date();
    date.setHours(hour, minutes);
    return date;
};

// STRING LOOKS LIKE THIS = Mon-Thurs: 8:00am-7:00pm, Fri: 8:00am - 1:30pm
const parseLocationTime = (hoursString) => {
    const timeRangesSeparator = ',';
    // [ 'Mon-Thu: 7:00am-7:00pm', ' Fri: 7:00am-2:00pm' ]
    const timeRanges = hoursString.split(timeRangesSeparator);
    const timeRangeForToday = timeRanges.find(timeRange => {
        const dayRangeAndTimeRangeSeparator = ':';
        const daysRange = timeRange.substring(0, timeRange.indexOf(dayRangeAndTimeRangeSeparator)).trim();
        const currentDay = getCurrentDay();
        const daySeparator = '-';
        if(daysRange.includes(daySeparator)) {
            const days = daysRange.split(daySeparator);
            const startDay = map[days[0]];
            const endDay = map[days[1]];
            return startDay <= currentDay && endDay >= currentDay;
        } else {
            const day = map[daysRange];
            return day <= currentDay && day >= currentDay;
        }
    }).trim();

    // Mon-Thu: 7:30am-8:30pm, Fri: 7:30am-1:30pm
    const replaced =
        timeRangeForToday
            .replace("a.m.", "am")
            .replace("p.m.", "pm")
            .split(' ')
            .join('');

    // [7:30am, 8:30pm]
    const times =
        replaced
            .substring(replaced.indexOf(':') + 1) // get rid of initial Day range up to :
            .trim() // dont think this is needed
            .split('-'); // separate into the start time and end time

    // 7:30am
    const startTime = times[0];
    const endTime = times[1];
    let startHour = getHourFromTimeString(startTime);
    let endHour = getHourFromTimeString(endTime);

    if (isPm(startTime) && isAm(endTime)) {
        const onAmSideOfRange = getCurrentHour() <= endHour;
        if (onAmSideOfRange) {
            startHour -= HOURS_IN_DAY;
        }
        // on pm side of range
        else {
            endHour += HOURS_IN_DAY;
        }
    } else if (isAm(startTime) && isAm(endTime)) {
        const onRightSideOfRange = getCurrentHour() <= endHour;
        if (onRightSideOfRange) {
            startHour -= HOURS_IN_DAY;
        }
        // on left side of range
        else {
            endHour += HOURS_IN_DAY;
        }
    }

    const startMinutes = getMinutesFromTimeString(startTime);
    const endMinutes = getMinutesFromTimeString(endTime);
    const startDate = makeDate(startHour, startMinutes);
    const endDate = makeDate(endHour, endMinutes);
    return {
        startTime: startDate,
        endTime: endDate
    }
};

const timeIsBetweenStartAndEnd = (time, startTime, endTime) => {
    return startTime < time && endTime > time;
};

const getOpenLocations = () => {
    return getAllLocations().filter(isOpenNow);
};

const isLocationOpen = (locationName) => {
    return isOpenNow(getRequestedLocation(locationName));
};

const isOpenNow = (location) => {
    const locationTimes = parseLocationTime(location.hours);
    const currentTime = new Date();
    return timeIsBetweenStartAndEnd(currentTime, locationTimes.startTime, locationTimes.endTime);
};

const getRequestedLocation = (locationName) => {
    return getAllLocations().find(location => {
        const locationNames = new Set([location.title, location.fulltitle, location.mapsearch]);
        return locationNames.has(locationName);
    });
};

const EVT_FUNCTION_ACTION_NAME_TO_FUNCTION = {
    'time': (req, res) => {
        console.log('Dining  reached');
        const request = require('request');

        const options = {
            method: 'GET',
            url: 'http://mc.lehigh.edu/services/dining/diningjson.html',
            headers:
                {
                    'Postman-Token': '0941584f-e6b8-471e-b562-bd3f487a71a9',
                    'Cache-Control': 'no-cache'
                }
        };

        // const locationObjectRequested = getRequestedLocation(req.body.queryResult.parameters.locationName);
        res.json({
            fulfillment_text: getOpenLocations().map(location => location.title).join(',')
        });

        // request(options, function(error, response, body) {
        //   if (error) {
        //     throw new Error(error);
        //   }
        //   // console.log(body);
        //   body = JSON.parse(body.substr(10));
        //   console.log(body);
        //   console.log();
        //   console.log(body.locations.category[0].location);
        //   //console.log(req.body.queryResult.parameters.Dining);
        //   res.json({
        //     fulfillment_text: body
        //   });
        // });
    },
    'menu': (req, res) => {
        let location = req.body.queryResult.parameters.location;
        let meal = req.body.queryResult.parameters.meal;
        res.json({
            fulfillment_text: location
        })
    }
};

module.exports = EVT_FUNCTION_ACTION_NAME_TO_FUNCTION;