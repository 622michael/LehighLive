const moment = require('moment');
const fs = require('fs');
const parser = require('xml2json');
const common = require('./common');
const isResidentDiningLocation = (locationName) => common.residentDiningLocations.has(locationName);

// const stationItemList = (stationList) => {
//     let itemList = [];
//     Array.from(stationList).forEach((stationStr) => {
//         let item = {
//             "info": {
//                 "key": stationStr
//             },
//             "title": stationStr,
//             "description": getStationMenu("Rathbone", moment("2018-04-18", "YYYY-MM-DD"), "Dinner", stationStr),
//             "image": {"imageUri": "http://www.sse-llc.com/uploads/7/7/2/6/77268303/published/lehigh-university-rathbone-hall-2.jpg?1519764495"}
//
//             // "openUrlAction": {
//             //     "url": "http://www.google.com"
//             // }
//         };
//         itemList.push(item);
//     });
//     return itemList;
// };

const stationItemList = (stationList) => {
    let itemList = [];
    Array.from(stationList).forEach((stationStr) => {
        let item = {
            "title": stationStr,
            "openUriAction": {
                "uri": "http://www.google.com"
            }
        };
        itemList.push(item);
    });
    return itemList;
};

const EVT_FUNCTION_ACTION_NAME_TO_FUNCTION = {
    'menu': (req, res) => {
        // const app = new WebhookClient({req, res});

        const parameters = req.body.queryResult.parameters;
        const location = parameters.location;
        const meal = parameters.meal;
        if (!isResidentDiningLocation(location)) {
            res.json({
                fulfillment_text: `I only know how to tell you what's for ${meal} at Rathbone, Lower Cort, and Brodhead`
            })
        }
        const now = moment();
        // console.log('Location:', location);
        // console.log('Meal:', meal);
        // console.log('Time:', now.format('YYYY-MM-DD'));

        let stationList = getStations(location, now, meal);
        // let stationMenu = getStationMenu(location, now, meal, 'Entrée');
        let itemList = stationItemList(stationList);

        // console.log('Station List:\n', stationList);
        // console.log('Station Menu List:\n', stationMenu);
        // console.log('Station Item List\n', itemList);


        // function makeWebsite(location, date, period, station) {
        //     let http = require('http');
        //
        //     http.createServer(function (req, res) {
        //         let html = buildHtml(req);
        //
        //         res.writeHead(200, {
        //             'Content-Type': 'text/html',
        //             'Content-Length': html.length,
        //             'Expires': new Date().toUTCString()
        //         });
        //         res.end(html);
        //     }).listen(8080);
        //
        //     function buildHtml(req) {
        //         let itemsFromStation = getStationMenu(location, date, period, station);
        //
        //         let liStatements = "";
        //         itemsFromStation.forEach(item => {
        //             liStatements += '<li>' + item + '</li>'
        //         });
        //
        //         return '' +
        //             '<!DOCTYPE html>\n' +
        //             '<html>\n' +
        //             '<head>\n' +
        //             '<title>Station Items</title>\n' +
        //             '</head>\n' +
        //             '<body style="background-color: #f77f6a; text-align: center;">\n' +
        //             '<h1>' + station + ' Station</h1>\n' +
        //             '<ul>\n' + itemsFromStation + '</ul>\n' +
        //             '</body>\n' +
        //             '</html>';
        //     }
        // }

        res.json({
            "fulfillmentMessages": [
                {
                    "basicCard":
                        {
                            "title": `${meal}: ${location} Stations`,
                            "subtitle": "Lehigh University",
                            "formattedText": "Choose a station.",
                            "image": {
                                "imageUri": "http://www.sse-llc.com/uploads/7/7/2/6/77268303/published/lehigh-university-rathbone-hall-2.jpg?1519764495",
                                "accessibilityText": "Rathbone"
                            },
                            "buttons": [
                                {
                                    "title": "Button 1",
                                    "openUriAction": {
                                        "uri": "http://www.google.com"
                                    }
                                }
                            ]
                        },
                    "platform": "ACTIONS_ON_GOOGLE"
                }
            ]
        });


        // res.json({
        //         "fulfillmentText": "Stations provided below:",
        //         "fulfillmentMessages": [
        //             {
        //                 "platform": "ACTIONS_ON_GOOGLE",
        //                 "carouselSelect": {
        //                     "items": itemList
        //                 }
        //             }
        //         ]
        //     }
        // );
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
