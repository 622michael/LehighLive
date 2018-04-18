const moment = require('moment');
const fs = require('fs');
const parser = require('xml2json');
const common = require('./common');
const isResidentDiningLocation = (locationName) => common.residentDiningLocations.has(locationName);

const stationItemList = (stationList) => {
    let itemList = [];
    Array.from(stationList).forEach((stationStr) => {
        let item = {
            "title": stationStr,
            "optionInfo": {
                "key": stationStr,
                "synonyms": [
                    stationStr + 's',
                    stationStr + '\'s'
                ]
            }
        };
        itemList.push(item);
    });
    return itemList;
};

const EVT_FUNCTION_ACTION_NAME_TO_FUNCTION = {
    'menu': (req, res) => {
        const parameters = req.body.queryResult.parameters;
        const location = parameters.location;
        const meal = parameters.meal;
        if (!isResidentDiningLocation(location)) {
            res.json({
                fulfillment_text: `I only know how to tell you what's for ${meal} at Rathbone, Lower Cort, and Brodhead`
            })
        }
        const now = moment();
        console.log('Location:', location);
        console.log('Meal:', meal);
        console.log('Time:', now.format('YYYY-MM-DD'));

        let stationList = getStations(location, now, meal);
        let stationMenu = getStationMenu(location, now, meal, 'Entrée');
        let itemList = stationItemList(stationList);

        // console.log('Station List:\n', stationList);
        // console.log('Station Menu List:\n', stationMenu);
        // console.log('Station Item List\n', itemList);
        res.json({
            fulfillment_messages: [
                {
                    "title": `Stations at ${location}.`,
                    "items": itemList,
                    "platform": "google",
                    "type": "list_card"
                }
            ]
        });
    },
};

const getStations = (location, date, period) => {
    const xmLFile = 'testdata/xml/rathbone.xml';
    const xmlData = fs.readFileSync(xmLFile, 'utf8');
    const jsonText = parser.toJson(xmlData);
    const item = JSON.parse(jsonText)['VFPData']['weeklymenu'];
    const time = date.format('YYYY-MM-DD');

    let stationList = [];
    item.forEach((attribute) => {
        const station = attribute['station'];
        if (attribute['menudate'] === time && attribute['meal'] === period && stationList.indexOf(station) === -1)
            stationList.push(station);
    });
    return stationList;
};

const getStationMenu = (location, date, period, station) => {
    const xmLFile = 'testdata/xml/rathbone.xml';
    const xmlData = fs.readFileSync(xmLFile, 'utf8');
    const jsonText = parser.toJson(xmlData);
    const item = JSON.parse(jsonText)['VFPData']['weeklymenu'];
    const time = date.format('YYYY-MM-DD');

    let stationItems = "";
    item.forEach((attribute) => {
        if (attribute['menudate'] === time && attribute['meal'] === period && attribute['station'] === station)
            stationItems += '- ' + attribute['item_name'] + '\n';
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