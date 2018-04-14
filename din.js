const moment = require('moment');
const fs = require('fs');
const parser = require('xml2json');
// DINtime
// What's open now?

const hourMinuteFormat = 'h:mma';

const RATHBONE_TITLE = 'Rathbone';
const CORT_TITLE = 'Cort';
const BRODHEAD_TITLE = 'Brodhead';
const residentDiningLocations = new Set([RATHBONE_TITLE, CORT_TITLE, BRODHEAD_TITLE]);
const isResidentDiningLocation = (locationName) => residentDiningLocations.has(locationName);

const json = require('./testdata/formatLocations');
const allLocations = json.locations.category.map(element => {
  return element.location;
}).reduce((acc, val) => acc.concat(val), []);

const getAllLocations = () => {
  return allLocations;
};

const getCurrentHour = () => moment().hours();

// STRING LOOKS LIKE THIS = Mon-Thurs: 8:00am-7:00pm, Fri: 8:00am - 1:30pm
const extractTodaysTimeRangeFromTimeRanges = (timeRanges) => {
  return timeRanges.find(timeRange => {
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
};

const getStartAndEndTimeForToday = (hoursString) => {
  const timeRangesSeparator = ',';
  // [ 'Mon-Thu: 7:00am-7:00pm', ' Fri: 7:00am-2:00pm' ]
  const timeRanges = hoursString.split(timeRangesSeparator).map(range => range.trim());
  const timeRangeForToday = extractTodaysTimeRangeFromTimeRanges(timeRanges);
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
  return isOpenNow(getRequestedLocationObject(locationName));
};

const isOpenDuringPeriod = (location, period) => {
  const startDinnerTime = moment("4:30pm", hourMinuteFormat);
  const startLunchTime = moment("10:30am", hourMinuteFormat);
  const endLunchTime = moment("2:00pm", hourMinuteFormat);
  const endBreakfastTime = moment("9:45am", hourMinuteFormat);
  const locationTimes = getStartAndEndTimeForToday(location.hours);
  if (period === "Dinner") {
    return startDinnerTime.isBefore(locationTimes.endTime);
  } else if (period === "Lunch") {
    return startLunchTime.isSameOrAfter(locationTimes.startTime) && endLunchTime.isSameOrBefore(locationTimes.endTime);
  } else {
    return endBreakfastTime.isAfter(locationTimes.startTime);
  }
};

const isOpenNow = (location) => {
  const locationTimes = getStartAndEndTimeForToday(location.hours);
  if (!locationTimes) return false;
  const currentTime = moment();
  return currentTime.isBetween(locationTimes.startTime, locationTimes.endTime);
};

const getRequestedLocationObject = (locationName) => {
  return getAllLocations().find(location => {
    const locationNames = new Set([location.title, location.fulltitle, location.mapsearch]);
    return locationNames.has(locationName);
  });
};

const EVT_FUNCTION_ACTION_NAME_TO_FUNCTION = {
  'time': (req, res) => {
    console.log('Dining  reached');
    // const locationObjectRequested = getRequestedLocation(req.body.queryResult.parameters.locationName);
    res.json({
      fulfillment_text: getOpenLocations().map(location => location.title).join(',')
    });
  },
  'menu': (req, res) => {
    const location = req.body.queryResult.parameters.location;
    const meal = req.body.queryResult.parameters.meal;
    if (!isResidentDiningLocation(location)) {
      res.json({
        fulfillment_text: `I only know how to tell you what's for ${meal} at Rathbone, Lower Cort, and Brodhead`
      })
    }
    if (!isOpenDuringPeriod(getRequestedLocationObject(location), meal)) {
      res.json({
        fulfillment_text: `${location} is not open for ${meal} today`
      })
    }
    console.log(location);
    console.log(meal);
    const now = moment();
    getMenu(location, now, meal);
    res.json({
      fulfillment_text: location + meal + now
    });
  }
};

const getMenu = (location, date, period) => {
  const fileName = 'testdata/xml/rathbone-week15.xml';
  const time = date.format('YYYY-MM-DD');
  console.log(time);
  fs.readFile(fileName, 'utf8', function(err, data) {
    if (err) {
      return 'No information on ' + location + ' found.';
    }
    const jsonText = parser.toJson(data);
    const weeklyMenus = JSON.parse(jsonText)['VFPData']['weeklymenu'];
    let currentStationName = undefined;
    const menuString = weeklyMenus.reduce((menuString, currentMenu) => {
      if (currentMenu['menudate'] === time && currentMenu['meal'] === period) {
        // Because items are listed sequentially by station, this is a switch to label what station the item is from
        const listItem = '- ' + currentMenu['item_name'] + '\n';
        if (currentMenu['station'] !== currentStationName) {
          currentStationName = currentMenu['station'];
          return menuString + currentStationName + ' Station:\n' + listItem;
        }
        return menuString + listItem;
        // if(currentMenu['allergens'] !== "") menuString += '- ' + currentMenu['allergens'] + '\n';
        // if(currentMenu['calories'] !== "") menuString += '- Calories: ' + currentMenu['calories'] + '\n';
      }
      return menuString;
    }, '');
    console.log(menuString);
    return menuString;
  });
};

module.exports = EVT_FUNCTION_ACTION_NAME_TO_FUNCTION;
