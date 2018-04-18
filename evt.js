const unirest = require('unirest');
const moment = require('moment');
//const request = require("request");
const fs = require('fs');
const parser = require('xml2json');


// function xmlToJson(url, callback) {
//     var req = http.get(url, function(res) {
//     var xml = '';
//
//     res.on('data', function (chunk) {
//       xml += chunk;
//       console.log("what");
//     });
//
//     res.on('error', function (e) {
//       callback(e, null);
//       console.log("is");
//     });
//
//     res.on('timeout', function (e) {
//       callback(e, null);
//       console.log("going");
//     });
//
//     res.on('end', function () {
//       parseString(xml, function (err, result) {
//         callback(null, result);
//         console.log("on");
//       });
//     });
//   });
// }

const EVT_FUNCTION_ACTION_NAME_TO_FUNCTION = {
    'today': (req, res) => {
      console.log('Event Today reached');
      let unirestReq = unirest('GET', 'https://clients6.google.com/calendar/v3/calendars/indark@lehigh.edu/events?calendarId=indark%40lehigh.edu&singleEvents=true&timeZone=America%2FNew_York&maxAttendees=1&maxResults=250&sanitizeHtml=true&timeMin=2018-04-06T00%3A00%3A00-04%3A00&timeMax=2018-05-15T00%3A00%3A00-04%3A00&key=AIzaSyBNlYH01_9Hc5S1J9vuFmu2nUqBZJNAXxs');
      unirestReq.headers({
        'Cache-Control': 'no-cache'
      });
      unirestReq.end(function(result) {
          if (result.error) {
            throw new Error(result.error);
          }
          console.log(result.body);
          //let events = [];
          console.log(moment(Date.now()));
          const threeDaysFromNow = moment(Date.now()).add(4, 'd');
          const aWeekFromNow = moment(Date.now()).add(7, 'd');
          const threeDay = result.body.items.map(event => {
            const dateTime = event.start.dateTime;
            const eventName = event.summary;
            console.log('moment : ' + moment(dateTime).fromNow() + ' ' + moment(dateTime).isAfter(Date.now()) + ' ' + moment(dateTime).isBefore(threeDaysFromNow));
            if (moment(dateTime).isAfter(Date.now())) {
              //events[i] = {"dateTime": dateTime};
              if (moment(dateTime).isBefore(threeDaysFromNow)) {
                const eventMoment = moment(dateTime);
                return eventName + ' on ' + eventMoment.format('dddd, MMMM Do');
              }
            }
          });
          console.log('EVENTS ARRAY');
          //console.log(events);
          console.log('3 DAY ARRAY');
          const filteredThreeDay = threeDay.filter(arr => arr);
          console.log(filteredThreeDay);
          // let outputName = req.body.session + "/contexts/event";
          // console.log(outputName);
          //   var outputContextsVal = [{
          //     name: outputName,
          //     "lifespanCount": 5,
          //     parameters: {
          //       event: filteredThreeDay
          //     }
          //   }];
          //   console.log("outputContextsVal");
          //   console.log(outputContextsVal);
          // handleRequest('2018-04-02', 'Breakfast');
          let returnedJson = {
            fulfillment_text: filteredThreeDay.join(', ')
            // outputContexts: outputContextsVal
          };
          console.log(returnedJson);
          res.json(returnedJson);
        }
      );
      console.log('Does this reach');
    },

    'sports':
      (req, res) => {
        console.log('Sports reached');
        const fileName = 'testdata/xml/athletics.xml';
        //const time = moment().format('')
        fs.readFile(fileName, 'utf8', function(err, data) {
          if (err) {
            return 'No athletics info found';
          }
          const jsonText = parser.toJson(data);
          const games = JSON.parse(jsonText)['scores']['game'];
          const gameString = games.reduce((gameString, currentGame) => {
            var currentTime = moment();
            var gameTime = moment(currentGame['time'], 'MM-DD-YYYY hh:mm:ss A');
            if (gameTime.isBetween(currentTime, currentTime.add(3, 'd'))) {
              const listItem = '- ' + currentGame['sport_abbrev'] + '\n';
              return gameString + listItem;
            }
            return gameString;
          });
          console.log(gameString);
        });

        // var request = require("request");
        //
        // var options = { method: 'GET',
        //     url: 'https://clients6.google.com/calendar/v3/calendars/kist2c0k2bugt3p9vo4gsgfuprs4oame@import.calendar.google.com/events?calendarId=kist2c0k2bugt3p9vo4gsgfuprs4oame%40import.calendar.google.com&singleEvents=true&timeZone=America%2FNew_York&maxAttendees=1&maxResults=250&sanitizeHtml=true&timeMin=2018-04-01T00%3A00%3A00-04%3A00&timeMax=2018-05-06T00%3A00%3A00-04%3A00&key=AIzaSyBNlYH01_9Hc5S1J9vuFmu2nUqBZJNAXxs',
        //
        //     headers:
        //         { 'Postman-Token': 'd42a0f1d-b3ae-4f3a-847e-2879508c1ef9',
        //             'Cache-Control': 'no-cache' } };
        //
        // request(options, function (error, response, body) {
        //     if (error) throw new Error(error);
        //
        //     console.log(body);
        //     // let itemList = JSON.parse(body.items);
        //     // var eventnames = new Array();
        //     // let names = itemList.map (event => {
        //     //     eventnames.push(event);
        //     // })
        //     // console.log(names);
        // });
        //
        // var options = { method: 'GET',
        //       url: 'http://lehighsports.com/services/scores.aspx',
        //       qs: { non_sport: '0', sort: 'asc', range: 'future' },
        //       headers:
        //           { 'Postman-Token': '7b587394-dae6-4299-92f9-5e6208ff964e',
        //               'Cache-Control': 'no-cache' } };
        // request(options, function (error, response, body) {
        //      if (error) throw new Error(error);
        //
        //      console.log("hi");
        //     console.dir(body);
        //     console.log("hello");
        // });


        res.json({
          fulfillment_text: 'Sports Reached'
        });
        //}
      }

// function handleRequest(menudate, meal) {
//     //fs.readFile('food.xml', 'utf8', function (err, data) {
//     var unirest = require("unirest");
//
//     var req = unirest("GET", "http://mc.lehigh.edu/services/dining/resident/Rathbone/Week_14_Rathbone.xml");
//
//     req.headers({
//         "Postman-Token": "dfa2aeb8-c260-49d1-8b13-b48b10ff73d4",
//         "Cache-Control": "no-cache"
//     });
//
//
//     unirest.get("http://mc.lehigh.edu/services/dining/resident/Rathbone/Week_14_Rathbone.xml").end( (function (res) {
//         if (res.error) throw new Error(res.error);
//         console.log(res.body);
//         fs.writeFile('/food2.xml',res.body,null,null);
//         var weeklyMenus = JSON.parse(res.body).VFPData.weeklymenu;
//         var station = "";
//         for (i in weeklyMenus) {
//             var menu = weeklyMenus[i];
//             if (menu['menudate'] == menudate && menu['meal'] == meal) {
//                 if (menu['station'] != station) {
//                     station = menu['station'];
//                     console.log(station + ' Station:');
//                 }
//                 console.log('\tItem: ' + menu['item_name']);
//                 if (menu['allergens'] != "") console.log('\t-', menu['allergens']);
//                 if (menu['station'] != "") console.log('\t-', menu['station']);
//             }
//         }
//         console.log(res.body);
//     }));
  }
;
module.exports = EVT_FUNCTION_ACTION_NAME_TO_FUNCTION;
