const moment = require('moment');
const unirest = require('unirest');
const parser = require('xml2json');
const common = require('./common');

const YEAR_MONTH_DAY_FORMAT = 'YYYY-MM-DD';
const DINNER_PERIOD = 'Dinner';
const LUNCH_PERIOD = 'Lunch';

const REQUEST_HEADERS = {
  'Cache-Control': 'no-cache'
};
// title is used to match with the location title here http://mc.lehigh.edu/services/dining/resident.xml
const RATHBONE = {
  title: 'Rathbone',
  displayTitle: 'Rathbone',
  imageUrl: common.RATHBONE_IMAGE_URL
};

const CORT = {
  title: 'Cort Lower U.C.',
  displayTitle: 'Lower Cort',
  imageUrl: common.CORT_IMAGE_URL
};

const BRODHEAD = {
  title: 'Brodhead Student Restaurant',
  displayTitle: 'Brodhead',
  imageUrl: common.BRODHEAD_IMAGE_URL
};

const nameToLocationObj = {
  [common.RATHBONE_DIALOGFLOW_TITLE]: RATHBONE,
  [common.CORT_DIALOGFLOW_TITLE]: CORT,
  [common.BRODHEAD_DIALOGFLOW_TITLE]: BRODHEAD
};

const getItemsGroupedByStation = (location, meal, date) => {
  return generateMenuUrlByLocationAndDate(location, date).then(menuUrl => {
    return new Promise((resolve, reject) => {
      unirest('GET', menuUrl)
        .headers(REQUEST_HEADERS)
        .end((xmlData) => {
        const jsonText = parser.toJson(xmlData.body);
        const item = JSON.parse(jsonText)['VFPData']['weeklymenu'];
        const stations = getStations(date, meal, item);
        const itemsGroupedByStation = stations.map(station => {
          return {
            'title': station,
            'description': getStationMenu(location.title, date, meal, station, item).map(menuItem => {
              return '• ' + menuItem;
            }).join('\n'),
            'image': {
              'imageUri': location.imageUrl,
              'accessibilityText': location.displayTitle
            },
            'info': {
              'key': station
            }
          };
        });
        resolve(itemsGroupedByStation);
      });
    });
  });
};

const EVT_FUNCTION_ACTION_NAME_TO_FUNCTION = {
  'menu': (req, res) => {
    const parameters = req.body.queryResult.parameters;
    const location = parameters.location;
    const meal = parameters.meal;
    const date = getDateFromRequestOrDefaultToNow(req);

    if (!common.isResidentDiningLocation(location)) {
      res.json({
        fulfillment_text: `I only know how to tell you what's for ${meal} at ${RATHBONE.displayTitle}, ${CORT.displayTitle}, and ${BRODHEAD.displayTitle}`
      });
      return;
    }

    getItemsGroupedByStation(nameToLocationObj[location], meal, date).then(items => {
      res.json({
        'fulfillmentText': 'Stations provided below:',
        'fulfillmentMessages': [
          {
            'platform': 'ACTIONS_ON_GOOGLE',
            'carouselSelect':
              {
                'items': items
              }
          }
        ]
      });
    });
  },

};

const getDateFromRequestOrDefaultToNow = (request) => {
  if (request.body.queryResult.parameters.date) {
    return moment(request.body.queryResult.parameters.date, common.DATE_FROM_REQUEST_FORMAT);
  } else {
    return moment();
  }
};

const getStations = (date, period, json) => {
  const time = date.format(YEAR_MONTH_DAY_FORMAT);
  const stationsAdded = {};
  return json.map(attribute => {
    const station = attribute['station'];
    if (attribute['menudate'] === time && attribute['meal'] === period && !stationsAdded[station]) {
      stationsAdded[station] = 1;
      return station;
    }
  }).filter(el => el && el !== 'Sodexo');
};

const generateMenuUrlByLocationAndDate = (location, date) => {
  const xmlFile = 'http://mc.lehigh.edu/services/dining/resident.xml';
  return new Promise((resolve, reject) => {
    unirest('GET', xmlFile)
      .headers(REQUEST_HEADERS)
      .end((result) => {
      if (result.error) {
        reject(result.error);
      }
      const jsonText = parser.toJson(result.body);
      const parsed = JSON.parse(jsonText);
      const locations = parsed.menu.location;
      const locationObj = locations.find(locObj => {
        return locObj.title === location.title;
      });
      const meals = locationObj.meal;
      const mealObj = meals.find(meal => {
        const mealWeekStartAndEnd = meal.title.split(' ').join('').split('-');
        const MEAL_WEEK_MONTH_DAY_YEAR_FORMAT = 'MMMDDYYYY';
        const mealWeekStart = moment(mealWeekStartAndEnd[0], MEAL_WEEK_MONTH_DAY_YEAR_FORMAT);
        const mealWeekEnd = moment(mealWeekStartAndEnd[1], MEAL_WEEK_MONTH_DAY_YEAR_FORMAT);
        return date.isBetween(mealWeekStart, mealWeekEnd);
      });
      const menunameSplit = mealObj.menuname.split('/');
      const menuName = menunameSplit[0];
      const weekString = menunameSplit[1];
      resolve(`http://mc.lehigh.edu/services/dining/resident/${menuName}/${weekString}.xml`);
    });
  });
};

const getStationMenu = (location, date, period, station, json) => {
  const time = date.format(YEAR_MONTH_DAY_FORMAT);
  return json.map(attribute => {
    if (attribute['menudate'] === time && attribute['meal'] === period && attribute['station'] === station) {
      return attribute['item_name'];
    }
  }).filter(el => el);
};

const isOpenDuringPeriod = (location, period) => {
  const startDinnerTime = moment('4:30pm', common.HOUR_MINUTE_FORMAT);
  const startLunchTime = moment('10:30am', common.HOUR_MINUTE_FORMAT);
  const endLunchTime = moment('2:00pm', common.HOUR_MINUTE_FORMAT);
  const endBreakfastTime = moment('9:45am', common.HOUR_MINUTE_FORMAT);
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
