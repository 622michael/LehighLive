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

const json = require('./testdata/formatLocations');
const allLocations = json.locations.category.map(element => {
  return element.location
}).reduce((acc, val) => acc.concat(val), []);

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
  if(endHour < startHour) endHour += 24;


  const startMinutes = parseInt(times[0].replace('am').split(':')[1]);
  const endMinutes = parseInt(times[1].replace('am').split(':')[1]);

  const startDate = new Date();
  startDate.setHours(startHour, startMinutes);

  const endDate = new Date();
  endDate.setHours(endHour, endMinutes);
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
      fulfillment_text: isLocationOpen("Rathbone")//getOpenLocations().map(location => location.title).join(',')
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
