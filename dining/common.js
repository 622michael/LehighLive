const moment = require('moment');
const HOUR_MINUTE_FORMAT = 'h:mma';
const DAY_OF_WEEK_TOKEN = 'ddd';
const DATE_FROM_REQUEST_FORMAT = "YYYY-MM-DD";

const RATHBONE_DIALOGFLOW_TITLE = 'Rathbone';
const CORT_DIALOGFLOW_TITLE = 'Cort';
const BRODHEAD_DIALOGFLOW_TITLE = 'Brodhead';
const RESIDENT_DINING_LOCATIONS = new Set([RATHBONE_DIALOGFLOW_TITLE, CORT_DIALOGFLOW_TITLE, BRODHEAD_DIALOGFLOW_TITLE]);
const RATHBONE_IMAGE_URL = 'http://www.sse-llc.com/uploads/7/7/2/6/77268303/published/lehigh-university-rathbone-hall-2.jpg?1519764495';
const CORT_IMAGE_URL = 'http://www.lehigh.edu/undergradprospectus/img/community-opener.jpg';
const BRODHEAD_IMAGE_URL = 'https://content-service.sodexomyway.com/media/Brodhead_Hero_tcm50-8459_w1920_h976.jpg?url=https://lehigh.sodexomyway.com/';

const isResidentDiningLocation = (locationName) => RESIDENT_DINING_LOCATIONS.has(locationName);

const getCurrentHour = () => moment().hours();
const getCurrentDay = () => moment().days();

const getStartAndEndTimeForToday = (hoursString) => {
  const timeRangesSeparator = ',';
  // [ 'Mon-Thu: 7:00am-7:00pm', ' Fri: 7:00am-2:00pm' ]
  const timeRanges = hoursString.split(timeRangesSeparator).map(range => range.trim());
  const timeRangeForToday = extractTodaysDayAndTimeRangeFromTimeRanges(timeRanges);
  console.log('TODAYRANGE', timeRangeForToday);
  if (!timeRangeForToday) {
    return undefined;
  }
  return convertTimeRangeToStartAndEndTimeForTodayAdjustedForAmPm(timeRangeForToday);
};

// STRING LOOKS LIKE THIS = Mon-Thurs: 8:00am-7:00pm, Fri: 8:00am - 1:30pm
// Returns a single one of the above and it returns todays
const extractTodaysDayAndTimeRangeFromTimeRanges = (timeRanges) => {
  const todaysRange = timeRanges.find(timeRange => {
    const dayRangeAndTimeRangeSeparator = ':';
    const daysRange = timeRange.substring(0, timeRange.indexOf(dayRangeAndTimeRangeSeparator)).trim();
    const daySeparator = '-';
    const daysOfRange = daysRange.split(daySeparator).map(day => day.substring(0, 3));
    const { startTime , endTime } = convertTimeRangeToStartAndEndTimeForTodayAdjustedForAmPm(timeRange);
    console.log('TIMERANGE=',timeRange);
    console.log('STARTIME=',startTime);
    console.log('ENDTIME=',endTime);
    return isNowBetweenStartAndEndTime(daysOfRange, startTime, endTime);
  });
  if (todaysRange) {
    return todaysRange.trim();
  }
  return todaysRange;
};

const isNowBetweenStartAndEndTime = (daysOfRangeArray, startTimeOfRangeAdjustedForAmPm, endTimeOfRangeAdjustedForAmPm) => {
  const now = moment();
  const isOneDayBefore = (first, second) => first.isSame(moment(second).subtract(1, 'day'), 'day');
  const withinClosingTime = now.isBefore(endTimeOfRangeAdjustedForAmPm);
  if (daysOfRangeArray.length > 1) {
    const startDay = moment(daysOfRangeArray[0], DAY_OF_WEEK_TOKEN);
    const endDay = moment(daysOfRangeArray[1], DAY_OF_WEEK_TOKEN);
    if (endDay.isBefore(startDay)) endDay.add(1, 'week');
    const inclusiveDayToken = '[]';
    const lastDayInRangeCrossedPastMidnight = isOneDayBefore(endDay, endTimeOfRangeAdjustedForAmPm);
    const dayIsWithinRange = now.isBetween(startDay, endDay, 'day', inclusiveDayToken);
    const inBetweenMidnightAndEndTimeOfPreviousRange = lastDayInRangeCrossedPastMidnight && withinClosingTime && now.isBefore(startTimeOfRangeAdjustedForAmPm);
    return dayIsWithinRange || inBetweenMidnightAndEndTimeOfPreviousRange;
  } else {
    const day = moment(daysOfRangeArray[0], DAY_OF_WEEK_TOKEN);
    const dayCrossedPastMidnight = isOneDayBefore(day, endTimeOfRangeAdjustedForAmPm);
    const inBetweenMidnightAndEndTimeOfPreviousDay = dayCrossedPastMidnight && withinClosingTime && now.isBefore(startTimeOfRangeAdjustedForAmPm);
    return now.isSame(day, 'day') || inBetweenMidnightAndEndTimeOfPreviousDay;
  }
};

// STRING LOOKS LIKE THIS = Mon-Thurs: 8:00am-7:00pm OR Fri: 8:00am - 1:30pm
const convertTimeRangeToStartAndEndTimeForTodayAdjustedForAmPm = (timeRange) => {
  const { startDay, endDay } = extractStartAndEndDayFromDayAndTimeRange(timeRange);

  // 7:30am. For now we just assume we're being passed the current day's time range
  const { startTime, endTime } = extractStartAndEndTimeFromDayAndTimeRange(timeRange);
  adjustDatesBasedOnAmPm(startTime, endTime, startDay, endDay);

  return {
    startTime: startTime,
    endTime: endTime
  };
};

const extractStartAndEndDayFromDayAndTimeRange = (timeRange) => {
  const split = timeRange.split(' ').join('').split(':')[0].split('-');
  return {
    startDay: moment(split[0], DAY_OF_WEEK_TOKEN),
    endDay: moment(split[split.length - 1], DAY_OF_WEEK_TOKEN)
  };
};

const extractStartAndEndTimeFromDayAndTimeRange = (timeRange) => {
  const replaced =
    timeRange
      .replace('a.m.', 'am')
      .replace('p.m.', 'pm')
      .split(' ')
      .join('');

  // [7:30am, 8:30pm]
  const startOfTimeRangeIndex = replaced.indexOf(':') + 1;
  const times = replaced.substring(startOfTimeRangeIndex).split('-'); // separate into the start time and end time
  return {
    startTime: moment(times[0], HOUR_MINUTE_FORMAT),
    endTime: moment(times[1], HOUR_MINUTE_FORMAT)
  };
};

const adjustDatesBasedOnAmPm = (startTime, endTime, startDay, endDay) => {
  const isPm = (momentTime) => momentTime.hours() >= 12;
  const isAm = (momentTime) => momentTime.hours() < 12;

  if (isPm(startTime) && isAm(endTime)) {
    adjustDatesForPmAmCase(startTime, endTime);
  } else if (isAm(startTime) && isAm(endTime)) {
    adjustDatesForAmAmCase(startTime, endTime, startDay, endDay);
  } else if ((isPm(startTime) && isPm(endTime)) || (isAm(startTime) && isPm(endTime))) {
    startTime.day(getCurrentDay());
    endTime.day(getCurrentDay());
  }
};

const adjustDatesForPmAmCase = (startTime, endTime) => {
  const onAmSideOfRange = getCurrentHour() <= endTime.hours();
  const singleDayObject = {days: 1};
  if (onAmSideOfRange) {
    // day was created based on current day, which is one day past the range, for example: Fri: 7:00PM - 2:00AM.
    // day was created on Saturday in the above example so the start time is 7:00PM on saturday. Subtract one day to bring it back to Friday.
    startTime.subtract(singleDayObject);
  }
  // on pm side of range
  else {
    // Opposite occurred, and we got 2AM on Friday, so add a day to make it 2AM on Saturday.
    endTime.add(singleDayObject);
  }
};

const adjustDatesForAmAmCase = (startTime, endTime, startDay, endDay) => {
  console.log(startTime);
  console.log(endTime);
  // Example time: Mon: 10:30AM - 2:00AM. If this is the time, our start time is ahead of our end time
  // because the range is actually saying Monday 10:30AM to 2:00AM Tuesday. We need to adjust.
  // If we're within midnight to 2:00AM range, our start time is ahead of where it should be by a day so we need to subtract from start time.
  const onRightSideOfRange = getCurrentHour() <= endTime.hours() && moment().isBetween(moment(startDay).add(1, 'day'), moment(endDay).add(1, 'day'));
  console.log('onrightside=',onRightSideOfRange);
  const singleDayObject = {days: 1};
  if (onRightSideOfRange) {
    startTime.subtract(singleDayObject);
  }
  // If we're within 10:30AM - midnight range, end time is 1 day behind where it should be so we need to add a day
  else {
    endTime.add(singleDayObject);
  }
};

module.exports = {
  getStartAndEndTimeForToday: getStartAndEndTimeForToday,
  isResidentDiningLocation: isResidentDiningLocation,
  HOUR_MINUTE_FORMAT: HOUR_MINUTE_FORMAT,
  DATE_FROM_REQUEST_FORMAT: DATE_FROM_REQUEST_FORMAT,
  RATHBONE_IMAGE_URL: RATHBONE_IMAGE_URL,
  CORT_IMAGE_URL: CORT_IMAGE_URL,
  BRODHEAD_IMAGE_URL: BRODHEAD_IMAGE_URL,
  RATHBONE_DIALOGFLOW_TITLE: RATHBONE_DIALOGFLOW_TITLE,
  CORT_DIALOGFLOW_TITLE: CORT_DIALOGFLOW_TITLE,
  BRODHEAD_DIALOGFLOW_TITLE: BRODHEAD_DIALOGFLOW_TITLE
};
