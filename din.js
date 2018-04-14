const moment = require('moment');
// DINtime
// What's open now?

const json = require('./testdata/formatLocations');
const allLocations = json.locations.category.map(element => {
  return element.location;
}).reduce((acc, val) => acc.concat(val), []);

const getAllLocations = () => {
  return allLocations;
};

const getCurrentHour = () => moment().hours();

// STRING LOOKS LIKE THIS = Mon-Thurs: 8:00am-7:00pm, Fri: 8:00am - 1:30pm
const getStartAndEndTimeForToday = (hoursString) => {
  const timeRangesSeparator = ',';
  // [ 'Mon-Thu: 7:00am-7:00pm', ' Fri: 7:00am-2:00pm' ]
  const timeRanges = hoursString.split(timeRangesSeparator);
  const timeRangeForToday = timeRanges.find(timeRange => {
    const dayRangeAndTimeRangeSeparator = ':';
    const daysRange = timeRange.substring(0, timeRange.indexOf(dayRangeAndTimeRangeSeparator)).trim();
    const rightNow = moment();
    const dayOfWeekToken = 'ddd';
    const daySeparator = '-';
    if (daysRange.includes(daySeparator)) {
      const days = daysRange.split(daySeparator).map(day => day.substring(0, 3));
      const startDay = moment(days[0], dayOfWeekToken);
      const endDay = moment(days[1], dayOfWeekToken);
      const inclusiveDayToken = '[]';
      return rightNow.isBetween(startDay, endDay, 'day', inclusiveDayToken);
    } else {
      const day = moment(daysRange, dayOfWeekToken);
      return rightNow.isSame(day, 'day');
    }
  }).trim();
  if (!timeRangeForToday) {
    return undefined;
  }
  // Mon-Thu: 7:30am-8:30pm OR Fri: 7:30am-1:30pm
  const replaced =
    timeRangeForToday
      .replace('a.m.', 'am')
      .replace('p.m.', 'pm')
      .split(' ')
      .join('');

  // [7:30am, 8:30pm]
  const startOfTimeRangeIndex = replaced.indexOf(':') + 1;
  const times = replaced.substring(startOfTimeRangeIndex).split('-'); // separate into the start time and end time

  // 7:30am
  const hourMinuteFormat = 'h:mma';
  const startTime = moment(times[0], hourMinuteFormat);
  const endTime = moment(times[1], hourMinuteFormat);
  const isPm = (momentTime) => momentTime.hours() >= 12;
  const isAm = (momentTime) => momentTime.hours() < 12;
  const singleDayObject = {days: 1};
  if (isPm(startTime) && isAm(endTime)) {
    const onAmSideOfRange = getCurrentHour() <= endTime.hours();
    if (onAmSideOfRange) {
      startTime.subtract(singleDayObject);
    }
    // on pm side of range
    else {
      endTime.add(singleDayObject);
    }
  } else if (isAm(startTime) && isAm(endTime)) {
    const onRightSideOfRange = getCurrentHour() <= endTime.hours();
    if (onRightSideOfRange) {
      startTime.subtract(singleDayObject);
    }
    // on left side of range
    else {
      endTime.add(singleDayObject);
    }
  }

  return {
    startTime: startTime,
    endTime: endTime
  };
};

const getOpenLocations = () => {
  return getAllLocations().filter(isOpenNow);
};

const isLocationOpen = (locationName) => {
  return isOpenNow(getRequestedLocation(locationName));
};

const isOpenNow = (location) => {
  const locationTimes = getStartAndEndTimeForToday(location.hours);
  if (!locationTimes) return false;
  const currentTime = moment();
  return currentTime.isBetween(locationTimes.startTime, locationTimes.endTime);
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
    console.log(location);
    console.log(meal);
    let now = moment();
    console.log(getMenu(location, now, meal));
    res.json({
      fulfillment_text: location + meal + now
    });
  }
};
const getMenu = (location, date, period) => {
  let menuString = '';
  let fs = require('fs');
  let parser = require('xml2json');
  let fileName = 'testdata/xml/' + location;

  let time = date.format('YYYY-MM-DD');
  console.log(time);

  fs.readFile(fileName + '.xml', 'utf8', function(err, data) {
    if (err) {
      return 'No information on ' + location + ' found.';
    }
    let jsonText = parser.toJson(data);
    let weeklyMenus = JSON.parse(jsonText)['VFPData']['weeklymenu'];
    let station = '';
    let i = 0;
    // goes through all the listed items on a menu

    for (i in weeklyMenus) {
      let menu = weeklyMenus[i];
      if (menu['menudate'] === time && menu['meal'] === period) {
        // Because items are listed sequentially by station, this is a switch to label what station the item is from
        if (menu['station'] !== station) {
          station = menu['station'];
          menuString += station + ' Station:\n';
        }
        menuString += '- ' + menu['item_name'] + '\n';
        // if(menu['allergens'] !== "") menuString += '- ' + menu['allergens'] + '\n';
        // if(menu['calories'] !== "") menuString += '- Calories: ' + menu['calories'] + '\n';
      }
    }
    console.log(menuString);
    return menuString;
  });
};
module.exports = EVT_FUNCTION_ACTION_NAME_TO_FUNCTION;
