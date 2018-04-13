const moment = require('moment');
// DINtime
// What's open now?

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

const DAYS_IN_MILLIS = 86400000;

const json = require('./testdata/formatLocations');
const allLocations = json.locations.category.map(element => {
  return element.location
}).reduce((acc, val) => acc.concat(val), []);

const days = [
  "Sunday",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Friday",
  "Saturday",
];

const getCurrentDayString = () => {
  return days[new Date().getDay()];
};

const getCurrentHours = () => {
  return new Date().getHours();
};

const getCurrentMinutes = () => {
  return new Date().getMinutes();
};

const getCurrentHoursAndMinutes = () => {
  return {
    hour: getCurrentHours(),
    minutes: getCurrentMinutes()
  }
};

const getAllLocations = () => {
  return allLocations;
};


const parseLocationTime = (hoursString) => {
  const timeRanges = hoursString.split(',');
  const timeRangeForToday = timeRanges.find(timeRange => {
    const daysRange = timeRange.substring(0, timeRange.indexOf(':')).trim();
    if(daysRange.includes('-')) {
      const days = daysRange.split('-');
      const startDay = map[days[0]];
      const endDay = map[days[1]];
      return startDay <= new Date().getDay() && endDay >= new Date().getDay();
    } else {
      const day = map[daysRange];
      return day <= new Date().getDay() && day >= new Date().getDay();
    }
  }).trim();

  let replaced = timeRangeForToday.replace("a.m.", "am");
  replaced = replaced.replace("p.m.", "pm").split(' ').join('');
  const times = replaced.substring(replaced.indexOf(':') + 1).trim().split('-');


  let startHour = times[0].indexOf("am") !== -1 ? parseInt(times[0].replace('am')) : parseInt(times[0].replace('pm')) + 12;
  let endHour = times[1].indexOf("am") !== -1 ? parseInt(times[1].replace('am')) : parseInt(times[1].replace('pm')) + 12;
  if(times[0] === "12:00pm") startHour = 12;
  if(times[0] === "12:00am") startHour = 0;
  if(times[1] === "12:00pm") endHour = 12;
  if(times[1] === "12:00am") endHour = 0;

  if(endHour < startHour)
  {
    endHour += 24;
  }

  const startMinutes = parseInt(times[0].replace('am').split(':')[1]);
  const endMinutes = parseInt(times[1].replace('am').split(':')[1]);


  let startDate = new Date();
  startDate.setHours(startHour, startMinutes);

  let endDate = new Date();
  console.log('BEFORE: END DAY=', endDate.getDay());
  console.log('BEFORE: END HOUR=', endDate.getHours());
  endDate.setHours(endHour, endMinutes);
  console.log('AFTER: END DAY=', endDate.getDay());
  console.log('AFTER: END HOUR=', endDate.getHours());

  console.log(replaced);
  console.log('hours:',startHour,endHour);
  console.log('minutes:',startMinutes, endMinutes);
  return {
    startTime: startDate,
    endTime: endDate
  }
};

const addDays = (date, days) => {
  return new Date(date.setTime(date.getTime() + days * DAYS_IN_MILLIS));
}

const timeIsBetweenStartAndEnd = (time, startTime, endTime) => {
  return (
    timeCompareTo(startTime, time) === -1  &&
    timeCompareTo(endTime, time) === 1
  );
};

const timeCompareTo = (time1, time2) => {
  if (time1.hour > time2.hour || time1.minutes > time2.minutes) {
    return 1;
  } else if (time1.hour === time2.hour && time1.minutes === time2.minutes) {
    return 0;
  } else {
    return -1;
  }
};

const getOpenLocations = () => {
  return getAllLocations().filter(isOpenNow);
};

const isLocationOpen = (locationName) => {
  return isOpenNow(getRequestedLocation(locationName));
};

const isOpenNow = (location) => {
  const locationTimes = parseLocationTime(location.hours);
  const currentTime = getCurrentHoursAndMinutes();
  return timeIsBetweenStartAndEnd(currentTime, locationTimes.startTime, locationTimes.endTime);
};


const getRequestedLocation = (locationName) => {
  return getAllLocations().find(location => {
    return (
      locationName === location.title ||
      locationName === location.fulltitle ||
      locationName === location.mapsearch
    );
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
  }
};

module.exports = EVT_FUNCTION_ACTION_NAME_TO_FUNCTION;
