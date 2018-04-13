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

const getHour = (hour) => {
  if(hour === "12:00am") return 0;
  if(hour === "12:00pm") return 12;
  else return hour.indexOf("am") !== -1 ? parseInt(hour.replace('am')) : parseInt(hour.replace('pm')) + 12;
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
  const startHour = getHour(startTime);
  let endHour = getHour(endTime);
  if(endHour < startHour) endHour += 24;

  // 30
  const startMinutes = parseInt(startTime.replace('am').split(':')[1]);
  const endMinutes = parseInt(startTime.replace('am').split(':')[1]);

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
    const locationNames = new Set(location.title, location.fulltitle, location.mapsearch);
    return locationName in locationNames;
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
