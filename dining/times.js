const moment = require('moment');
const momentDurationFormatSetup = require("moment-duration-format");
const common = require('./common');
momentDurationFormatSetup(moment);

const json = require('../testdata/formatLocations');

const allLocations = json.locations.category.map(element => {
  return element.location;
}).reduce((acc, val) => acc.concat(val), []);

const getAllLocations = () => {
  return allLocations;
};

const getRequestedLocationObject = (locationName) => {
    return getAllLocations().find(location => {
        const locationNames = new Set([location.title, location.fulltitle, location.mapsearch]);
        return locationNames.has(locationName);
    });
};

const minutesAsHoursAndMinutes = (minutes) => {
  const prettyPrintHoursAndMinutesFormat = "h [hours and] m [minutes]";
  return moment.duration(minutes, "minutes").format(prettyPrintHoursAndMinutesFormat);
};

const getOpenLocations = () => {
  return getAllLocations().filter(location => isOpen(location, moment()));
};

const getLocationHoursInfo = (locationName, time) => {
  const location = getRequestedLocationObject(locationName);
  const locationTimes = common.getStartAndEndTimeForToday(location.hours);
  if (!locationTimes) {
    return {
      name: locationName,
      isOpen: false,
      isClosedForEntireDay: true
    }
  }
  const { startTime, endTime } = locationTimes;
  console.log('start', startTime);
  console.log('current time', time);
  console.log('end', endTime);
  console.log('isOpen', time.isBetween(startTime, endTime));
  return {
    name: locationName,
    isOpen: time.isBetween(startTime, endTime),
    minutesUntilClose: moment.duration(endTime.diff(time)).asMinutes(),
    minutesUntilOpen: moment.duration(startTime.diff(time)).asMinutes(),
    openTime: startTime.format(common.hourMinuteFormat),
    closeTime: endTime.format(common.hourMinuteFormat),
    isClosedForEntireDay: false
  }
};

const isOpen = (location, time) => {
  const locationTimes = common.getStartAndEndTimeForToday(location.hours);
  if (!locationTimes) return false;
  return time.isBetween(locationTimes.startTime, locationTimes.endTime);
};

const getLocationHoursInfoFromRequest = (request) => {
  const locationName = request.body.queryResult.parameters.location;
  return getLocationHoursInfo(locationName, moment());
};

const EVT_FUNCTION_ACTION_NAME_TO_FUNCTION = {
  'openlocations': (req, res) => {
    // const locationObjectRequested = getRequestedLocation(req.body.queryResult.parameters.locationName);

    res.json({
      fulfillment_text: (
        `Here's what's open right now: 
        ${getOpenLocations().map(location => location.title).join('\n')}
        `
      )
    });
  },

  'isopen': (req, res) => {
    const { isOpen, minutesUntilClose, minutesUntilOpen, openTime, closeTime, isClosedForEntireDay } = getLocationHoursInfoFromRequest(req);
    let responseText;
    if (minutesUntilClose > 0 && minutesUntilClose <= 45) {
      responseText = `Yes, but it's closing in ${minutesUntilClose.toFixed()} minutes. Better hurry!`;
    } else if (minutesUntilOpen > 0 && minutesUntilOpen <= 30) {
      responseText = `It's not open now, but it will be in ${minutesUntilOpen.toFixed()} minutes.`;
    } else if (isOpen) {
      responseText = `Yep! It's open from ${openTime}-${closeTime} today.`;
    } else if (isClosedForEntireDay) {
      responseText = `No, it's closed for the whole day`;
    } else {
      responseText = `It's not... the hours are from ${openTime}-${closeTime} today`;
    }
    res.json({
      fulfillment_text: responseText
    })
  },

  'isclosed': (req, res) => {
    const { isOpen, minutesUntilClose, minutesUntilOpen, openTime, closeTime, isClosedForEntireDay } = getLocationHoursInfoFromRequest(req);
    let responseText;
    if (minutesUntilClose > 0 && minutesUntilClose <= 45) {
      responseText = `No, but it's closing in ${minutesUntilClose.toFixed()} minutes. Better hurry!`;
    } else if (minutesUntilOpen > 0 && minutesUntilOpen <= 30) {
      responseText = `Yes, but it will be open in ${minutesUntilOpen.toFixed()} minutes.`;
    } else if (isOpen) {
      responseText = `It's not closed. It's open from ${openTime}-${closeTime} today.`;
    } else if (isClosedForEntireDay) {
      responseText = `Yes, it's closed for the whole day.`;
    } else {
      responseText = `Yes, but it's open from ${openTime}-${closeTime} today`;
    }
    res.json({
      fulfillment_text: responseText
    })
  },

  'whenislocationopen': (req, res) => {
    const { name, isOpen, minutesUntilClose, minutesUntilOpen, openTime, closeTime, isClosedForEntireDay } = getLocationHoursInfoFromRequest(req);
    let responseText;
    const hoursString = `The hours are ${openTime}-${closeTime}`;
    if (minutesUntilClose > 0 && minutesUntilClose <= 45) {
      responseText = `It's open right now, but it's closing in ${minutesUntilClose.toFixed()} minutes. Better hurry!`;
    } else if (minutesUntilOpen > 0 && minutesUntilOpen <= 30) {
      responseText = `It opens in ${minutesUntilOpen.toFixed()} minutes. ${hoursString}`;
    } else if (isOpen) {
      responseText = `It's already open! ${hoursString}`;
    } else if (isClosedForEntireDay) {
      responseText = `${name} is closed for the whole day.`;
    } else {
      responseText = `It opens at ${openTime} and closes at ${closeTime} today.`;
    }
    res.json({
      fulfillment_text: responseText
    })
  },

  'whenislocationclosed': (req, res) => {
    const { name, isOpen, minutesUntilClose, minutesUntilOpen, openTime, closeTime, isClosedForEntireDay } = getLocationHoursInfoFromRequest(req);
    let responseText;
    const hoursString = `The hours are ${openTime}-${closeTime}`;
    if (minutesUntilClose > 0 && minutesUntilClose <= 45) {
      responseText = `It's closing in ${minutesUntilClose.toFixed()} minutes. Better hurry!`;
    } else if (minutesUntilOpen > 0 && minutesUntilOpen <= 30) {
      responseText = `It doesn't close for awhile. It's open in ${minutesUntilOpen.toFixed()} minutes. ${hoursString}`;
    } else if (isClosedForEntireDay) {
      responseText = `${name} is closed for the whole day.`;
    } else if (!isOpen) {
      responseText = `It's already closed but the hours are ${openTime}-${closeTime} today.`;
    }  else {
      responseText = `It closes at ${closeTime} today. ${hoursString}`;
    }
    res.json({
      fulfillment_text: responseText
    })
  },

  'hours': (req, res) => {
    const { name, isClosedForEntireDay, openTime, closeTime } = getLocationHoursInfoFromRequest(req);
    let responseText;
    if (isClosedForEntireDay) {
      responseText = `${name} is closed for the day.`;
    } else {
      responseText = `The hours for ${name} today are ${openTime}-${closeTime}`;
    }
    res.json({
      fulfillment_text: responseText
    });
  }
};

module.exports = EVT_FUNCTION_ACTION_NAME_TO_FUNCTION;
