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
        const now = moment();
        console.log('Location:', location);
        console.log('Meal:', meal);
        console.log('Time:', now.format('YYYY-MM-DD'));
        console.log('Station List:\n', getStations(location, now, meal));
        console.log('Station Menu List:\n', getStationMenu(location, now, meal, 'Entrée'));
        res.json({
            fulfillment_text: getStationMenu(location, now, meal, 'Entrée')
        });
    },
};

const getStations = (location, date, period) => {
    const fileName = 'testdata/xml/rathbone.xml';
    const time = date.format('YYYY-MM-DD');
    const data = fs.readFileSync(fileName, 'utf8');
    const jsonText = parser.toJson(data);
    const weeklyMenus = JSON.parse(jsonText)['VFPData']['weeklymenu'];

    let stationList = [];
    weeklyMenus.forEach((itemInMenu) => {
        const item = itemInMenu['station'];
        if (itemInMenu['menudate'] === time && itemInMenu['meal'] === period && stationList.indexOf(item) === -1)
            stationList.push(item);
    });
    return stationList;
};

const getStationMenu = (location, date, period, station) => {
    const fileName = 'testdata/xml/rathbone.xml';
    const time = date.format('YYYY-MM-DD');
    const data = fs.readFileSync(fileName, 'utf8');
    const jsonText = parser.toJson(data);
    const weeklyMenus = JSON.parse(jsonText)['VFPData']['weeklymenu'];

    let stationItems = "";
    weeklyMenus.forEach((itemInMenu) => {
        if (itemInMenu['menudate'] === time && itemInMenu['meal'] === period && itemInMenu['station'] === station)
            stationItems += '- ' + itemInMenu['item_name'] + '\n';
    });
    return stationItems;
};

const isOpenDuringPeriod = (location, period) => {
    const startDinnerTime = moment("4:30pm", common.hourMinuteFormat);
    const startLunchTime = moment("10:30am", common.hourMinuteFormat);
    const endLunchTime = moment("2:00pm", common.hourMinuteFormat);
    const endBreakfastTime = moment("9:45am", common.hourMinuteFormat);
    const locationTimes = common.getStartAndEndTimeForToday(location.hours);
    const {startTime, endTime} = locationTimes;
    if (period === "Dinner") {
        return startDinnerTime.isBefore(endTime);
    } else if (period === "Lunch") {
        return startLunchTime.isSameOrAfter(startTime) && endLunchTime.isSameOrBefore(endTime);
    } else {
        return endBreakfastTime.isAfter(startTime);
    }
};

module.exports = EVT_FUNCTION_ACTION_NAME_TO_FUNCTION;
