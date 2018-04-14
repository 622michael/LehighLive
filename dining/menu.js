const moment = require('moment');
const fs = require('fs');
const parser = require('xml2json');
const common = require('./common');
const isResidentDiningLocation = (locationName) => common.residentDiningLocations.has(locationName);

const EVT_FUNCTION_ACTION_NAME_TO_FUNCTION = {
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

const isOpenDuringPeriod = (location, period) => {
  const startDinnerTime = moment("4:30pm", common.hourMinuteFormat);
  const startLunchTime = moment("10:30am", common.hourMinuteFormat);
  const endLunchTime = moment("2:00pm", common.hourMinuteFormat);
  const endBreakfastTime = moment("9:45am", common.hourMinuteFormat);
  const locationTimes = common.getStartAndEndTimeForToday(location.hours);
  const { startTime, endTime } = locationTimes;
  if (period === "Dinner") {
    return startDinnerTime.isBefore(endTime);
  } else if (period === "Lunch") {
    return startLunchTime.isSameOrAfter(startTime) && endLunchTime.isSameOrBefore(endTime);
  } else {
    return endBreakfastTime.isAfter(startTime);
  }
};

module.exports = EVT_FUNCTION_ACTION_NAME_TO_FUNCTION;
