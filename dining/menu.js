const moment = require('moment');
const fs = require('fs');
const parser = require('xml2json');
const common = require('./common');
const isResidentDiningLocation = (locationName) => common.residentDiningLocations.has(locationName);

const stationItemList = (stationList) => {
    let itemList = [];
    Array.from(stationList).forEach((stationStr) => {
        let item = {
            "info": {
                "key": stationStr,
                "image": {}
            },
            "title": stationStr
        };
        itemList.push(item);
    });
    return itemList;
};
//
// const functions = require('firebase-functions');
// const {WebhookClient} = require('dialogflow-fulfillment');
// const {Card, Suggestion} = require('dialogflow-fulfillment');

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


        // const { DialogflowApp } = require('actions-on-google')
        // const googleAssistant = new DialogflowApp();
        // let testList = [];
        // testList.push(googleAssistant.buildOptionItem('Item1').setTitle("Item1 Test").setDescription("Please work"));
        // const bigList = googleAssistant.buildList().addItems(testList);
        // console.log(JSON.stringify(bigList))


        // function yourFunctionHandler(agent) {
        //   agent.add(`This message is from Dialogflow's Cloud Functions for Firebase inline editor!`);
        //   agent.add(new Card({
        //       title: `Title: this is a card title`,
        //       imageUrl: 'https://dialogflow.com/images/api_home_laptop.svg',
        //       text: `This is the body text of a card.  You can even use line\n  breaks and emoji! 💁`,
        //       buttonText: 'This is a button',
        //       buttonUrl: 'https://docs.dialogflow.com/'
        //     })
        //   );
        //   agent.add(new Suggestion(`Quick Reply`));
        //   agent.add(new Suggestion(`Suggestion`));
        // }
        //
        // let intentMap = new Map();
        //
        // intentMap.set('menu', yourFunctionHandler(app));
        // app.handleRequest(intentMap);

        // let response = "This is a sample response from your webhook!";//Default response from the webhook to show it’s working
        // let responseObj = {
        //     "fulfillmentText": response
        //     , "fulfillmentMessages": [
        //         {
        //             "name": "TestA",
        //             "displayName": "menu",
        //             "webhookState": "",
        //             "messages": [
        //                 {
        //                     "platform": "ACTIONS_ON_GOOGLE",
        //                     "listSelect": {
        //                         "title": "Stations",
        //
        //                         "items": itemList
        //                     }
        //                 }
        //             ]
        //
        //         }
        //     ]
        //     , "source": ""
        // };
        // res.json(responseObj);


        res.json({
                "fulfillmentMessages": [
                    {
                        "platform": "ACTIONS_ON_GOOGLE",
                        "listSelect": {
                            "title": "Stations",
                            "items": itemList
                        }
                    }
                ]
            }
        );


        // res.json(
        //     {
        //         "fulfillmentMessages": [
        //             {
        //                 "platform": "ACTIONS_ON_GOOGLE",
        //                 "simpleResponses": {
        //                     "simpleResponses": [
        //                         {
        //                             "textToSpeech": "Response you will hear.",
        //                             "displayText": "Response you will see."
        //                         }
        //                     ]
        //                 }
        //             }
        //         ]
        //     }
        //
        // );

    }
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
