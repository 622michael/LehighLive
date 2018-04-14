const moment = require('moment');
const fs = require('fs');
const parser = require('xml2json');
// DINtime
// What's open now?

const hourMinuteFormat = 'h:mma';
const dayOfWeekToken = 'ddd';

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
// Returns a single one of the above and it returns todays
const extractTodaysDayAndTimeRangeFromTimeRanges = (timeRanges) => {
  return timeRanges.find(timeRange => {
    console.log('------------------------------------------------------');
    const dayRangeAndTimeRangeSeparator = ':';
    const daysRange = timeRange.substring(0, timeRange.indexOf(dayRangeAndTimeRangeSeparator)).trim();
    const rightNow = moment();
    const daySeparator = '-';
    if (daysRange.includes(daySeparator)) {
      const days = daysRange.split(daySeparator).map(day => day.substring(0, 3));
      const startDay = moment(days[0], dayOfWeekToken);
      const endDay = moment(days[1], dayOfWeekToken);
      const l = extractStartAndEndTimeFromDayAndTimeRangeString(timeRange);
      console.log('thingafterreturn',l);
      console.log('endtimehere',l.endTime);
      console.log('make it back');
      const endTime = l.endTime;
      const inclusiveDayToken = '[]';
      console.log('first', endDay.isSame(moment(endTime).subtract(1, 'day'), 'day'));
      const first = endDay.isSame(moment(endTime).subtract(1, 'day'), 'day');
      console.log('first', first);
      console.log('endtimeinif',endTime);
      console.log('second',rightNow.isBefore(endTime));
      const second = rightNow.isBefore(endTime);
      console.log('second',second);
      const isBetween = rightNow.isBetween(startDay, endDay, 'day', inclusiveDayToken);
      console.log('third', isBetween || (first && second));
      return isBetween || (first && second);
    } else {
      const day = moment(daysRange, dayOfWeekToken);
      return rightNow.isSame(day, 'day');
    }
  }).trim();
};

const extractStartAndEndDayFromDayAndTimeRangeString = (timeRange) => {
  const split = timeRange.split(' ').join('').split(':')[0].split('-');
  return {
    startDay: moment(split[0], dayOfWeekToken),
    endDay: moment(split[split.length - 1], dayOfWeekToken)
  };
};

// STRING LOOKS LIKE THIS = Mon-Thurs: 8:00am-7:00pm OR Fri: 8:00am - 1:30pm
const extractStartAndEndTimeFromDayAndTimeRangeString = (timeRange) => {
  const replaced =
    timeRange
      .replace('a.m.', 'am')
      .replace('p.m.', 'pm')
      .split(' ')
      .join('');

  // [7:30am, 8:30pm]
  const startOfTimeRangeIndex = replaced.indexOf(':') + 1;
  const times = replaced.substring(startOfTimeRangeIndex).split('-'); // separate into the start time and end time

  const days = extractStartAndEndDayFromDayAndTimeRangeString(timeRange);

  // 7:30am
  const startTime = moment(times[0], hourMinuteFormat);
  const endTime = moment(times[1], hourMinuteFormat);
  console.log('starttime',startTime);
  console.log('endtime', endTime);
  const isPm = (momentTime) => momentTime.hours() >= 12;
  const isAm = (momentTime) => momentTime.hours() < 12;
  const singleDayObject = {days: 1};
  console.log('ispm',isPm(startTime));
  console.log('isam',isAm(endTime));
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
    const movedPastEndTimeOfPreviousDay = moment().isSame(days.endDay, 'day');
    const onRightSideOfRange = getCurrentHour() <= endTime.hours() && !movedPastEndTimeOfPreviousDay;
    if (onRightSideOfRange) {
      startTime.subtract(singleDayObject);
    }
    // on left side of range
    else {
      endTime.add(singleDayObject);
    }
  }
  console.log('starttimeafter',startTime);
  console.log('endtimeafter', endTime);

  const thing = {
    startTime: startTime,
    endTime: endTime
  };
  console.log('thingbeforereturn', thing);
  return thing;
};

const getStartAndEndTimeForToday = (hoursString) => {
  const timeRangesSeparator = ',';
  // [ 'Mon-Thu: 7:00am-7:00pm', ' Fri: 7:00am-2:00pm' ]
  const timeRanges = hoursString.split(timeRangesSeparator).map(range => range.trim());
  const timeRangeForToday = extractTodaysDayAndTimeRangeFromTimeRanges(timeRanges);
  if (!timeRangeForToday) {
    return undefined;
  }
  console.log('===========================================');
  console.log('todaytimerange=',timeRangeForToday);
  console.log('-----------------------------------------');
  const thing = extractStartAndEndTimeFromDayAndTimeRangeString(timeRangeForToday);
  console.log('beforereturn',thing);
  return thing;
};

const getOpenLocations = () => {
  return getAllLocations().filter(isOpenNow);
};

const getLocationHoursInfo = (locationName) => {
  const location = getRequestedLocationObject(locationName);
  const locationTimes = getStartAndEndTimeForToday(location.hours);
  const currentTime = moment();
  if (!locationTimes) {
    return {
      isOpen: false
    }
  }
  const { startTime, endTime } = locationTimes;
  return {
    isOpen: currentTime.isBetween(startTime, endTime),
    minutesUntilClose: moment.duration(endTime.diff(currentTime)).asMinutes(),
    minutesUntilOpen: moment.duration(startTime.diff(currentTime)).asMinutes(),
    openTime: startTime.format(hourMinuteFormat),
    closeTime: endTime.format(hourMinuteFormat)
  }
};

const isOpenDuringPeriod = (location, period) => {
  const startDinnerTime = moment("4:30pm", hourMinuteFormat);
  const startLunchTime = moment("10:30am", hourMinuteFormat);
  const endLunchTime = moment("2:00pm", hourMinuteFormat);
  const endBreakfastTime = moment("9:45am", hourMinuteFormat);
  const locationTimes = getStartAndEndTimeForToday(location.hours);
  const { startTime, endTime } = locationTimes;
  if (period === "Dinner") {
    return startDinnerTime.isBefore(endTime);
  } else if (period === "Lunch") {
    return startLunchTime.isSameOrAfter(startTime) && endLunchTime.isSameOrBefore(endTime);
  } else {
    return endBreakfastTime.isAfter(startTime);
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
  },
  'islocationopen': (req, res) => {
    const locationName = req.body.queryResult.parameters.location;
    const locationHoursInfo = getLocationHoursInfo(locationName);
    const { isOpen, minutesUntilClose, minutesUntilOpen, openTime, closeTime } = locationHoursInfo;
    //console.log(locationHoursInfo);
    let responseText;
    if (minutesUntilClose > 0 && minutesUntilClose <= 45) {
      responseText = `Yes, but it's closing in ${minutesUntilClose.toFixed()} minutes. Better hurry!`;
    } else if (minutesUntilOpen > 0 && minutesUntilOpen <= 30) {
      responseText = `It's not open now, but it will be in ${minutesUntilOpen.toFixed()} minutes.`;
    } else if (isOpen) {
      responseText = `Yep! It's open from ${openTime} to ${closeTime} today.`;
    } else {
      responseText = `It's not... the hours are from ${openTime} to ${closeTime} today`;
    }
    res.json({
      fulfillment_text: responseText
    })
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
