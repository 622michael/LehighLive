const moment = require('moment');
const fs = require('fs');
const parser = require('xml2json');
const common = require('./common');
const isResidentDiningLocation = (locationName) => common.residentDiningLocations.has(locationName);

const YEAR_MONTH_DAY_FORMAT = 'YYYY-MM-DD';
const DINNER_PERIOD = 'Dinner';
const LUNCH_PERIOD = 'Lunch';
const BREAKFAST_PERIOD = 'Breakfast';

const RATHBONE = 'Rathbone';
const CORT = 'Lower Cort';
const BRODHEAD = 'Brodhead';

const getItemsGroupedByStation = (stationList) => {
  return stationList.map((stationStr) => {
    return {
      'title': stationStr,
      'description': getStationMenu(RATHBONE, moment('2018-04-18', YEAR_MONTH_DAY_FORMAT), DINNER_PERIOD, stationStr).join(', '),
      'image': {
        'imageUri': 'http://www.sse-llc.com/uploads/7/7/2/6/77268303/published/lehigh-university-rathbone-hall-2.jpg?1519764495',
        'accessibilityText': RATHBONE
      },
      'info': {
        'key': stationStr
      }
    };
  });
};

const EVT_FUNCTION_ACTION_NAME_TO_FUNCTION = {
  'menu': (req, res) => {

    const parameters = req.body.queryResult.parameters;
    const location = parameters.location;
    const meal = parameters.meal;
    if (!isResidentDiningLocation(location)) {
      res.json({
        fulfillment_text: `I only know how to tell you what's for ${meal} at ${RATHBONE}, ${CORT}, and ${BRODHEAD}`
      });
      return;
    }
    const now = moment();
    // console.log('Location:', location);
    // console.log('Meal:', meal);
    // console.log('Time:', now.format('YYYY-MM-DD'));

    let stationList = getStations(location, now, meal);
    // let stationMenu = getStationMenu(location, now, meal, 'Entrée');
    let itemList = getItemsGroupedByStation(stationList);

    // console.log('Station List:\n', stationList);
    // console.log('Station Menu List:\n', stationMenu);
    // console.log('Station Item List\n', itemList);

    res.json({
      'fulfillmentText': 'Stations provided below:',
      'fulfillmentMessages': [
        {
          'platform': 'ACTIONS_ON_GOOGLE',
          'carouselSelect':
            {
              'items': itemList
            }
        }
      ]
    });
  },

  'stationMenu': (req, res) => {
    // const queryResult = req.body.queryResult;
    // const station = queryResult.parameters.station;
    //
    // const contextResult = queryResult.outputContexts.parameters;
    // const location = contextResult.location;
    // const meal = contextResult.meal;
    // const time = moment('2018-04-18', 'YYYY-MM-DD');
    //
    // if(location && meal && time && station)
    // {
    //     res.json({
    //        fulfillmentText: 'List for this station: ' + getStationMenu(location, time, meal, station)
    //     });
    // }
    // else {
    //     res.json({
    //         fulfillmentText: 'Sorry, I don\'t understand?'
    //     });
    // }

    res.json({
      fulfillmentText: 'Test to see if follow up works'
    });
  }

};

const getStations = (location, date, period) => {
  const xmLFile = 'testdata/xml/rathbone.xml';
  const xmlData = fs.readFileSync(xmLFile, 'utf8');
  const jsonText = parser.toJson(xmlData);
  const item = JSON.parse(jsonText)['VFPData']['weeklymenu'];
  const time = date.format(YEAR_MONTH_DAY_FORMAT);

  const stationsAdded = {};
  return item.map(attribute => {
    const station = attribute['station'];
    if (attribute['menudate'] === time && attribute['meal'] === period && !stationsAdded[station]) {
      stationsAdded[station] = 1;
      return station;
    }
  }).filter(el => el && el !== 'Sodexo');
};

const getStationMenu = (location, date, period, station) => {
  const xmLFile = 'testdata/xml/rathbone.xml';
  const xmlData = fs.readFileSync(xmLFile, 'utf8');
  const jsonText = parser.toJson(xmlData);
  const item = JSON.parse(jsonText)['VFPData']['weeklymenu'];
  const time = date.format(YEAR_MONTH_DAY_FORMAT);

  return item.map(attribute => {
    if (attribute['menudate'] === time && attribute['meal'] === period && attribute['station'] === station) {
      return attribute['item_name'];
    }
  }).filter(el => el);
};

const isOpenDuringPeriod = (location, period) => {
  const startDinnerTime = moment('4:30pm', common.hourMinuteFormat);
  const startLunchTime = moment('10:30am', common.hourMinuteFormat);
  const endLunchTime = moment('2:00pm', common.hourMinuteFormat);
  const endBreakfastTime = moment('9:45am', common.hourMinuteFormat);
  const locationTimes = common.getStartAndEndTimeForToday(location.hours);
  const {startTime, endTime} = locationTimes;
  if (period === DINNER_PERIOD) {
    return startDinnerTime.isBefore(endTime);
  } else if (period === LUNCH_PERIOD) {
    return startLunchTime.isSameOrAfter(startTime) && endLunchTime.isSameOrBefore(endTime);
  } else {
    return endBreakfastTime.isAfter(startTime);
  }
};

module.exports = EVT_FUNCTION_ACTION_NAME_TO_FUNCTION;
