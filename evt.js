const unirest = require('unirest');
const moment = require('moment');
const fs = require('fs');
const parser = require('xml2json');

const EVT_FUNCTION_ACTION_NAME_TO_FUNCTION = {
    'today': (req, res) => {
      const queryResult = req.body.queryResult;
      const date = queryResult.parameters;
      console.log(date);

      console.log('Event Today reached');
      let unirestReq = unirest('GET', 'https://clients6.google.com/calendar/v3/calendars/indark@lehigh.edu/events?calendarId=indark%40lehigh.edu&singleEvents=true&timeZone=America%2FNew_York&maxAttendees=1&maxResults=250&sanitizeHtml=true&timeMin=2018-04-06T00%3A00%3A00-04%3A00&timeMax=2018-05-15T00%3A00%3A00-04%3A00&key=AIzaSyBNlYH01_9Hc5S1J9vuFmu2nUqBZJNAXxs');
      unirestReq.headers({
        'Cache-Control': 'no-cache'
      });
      unirestReq.end(function (result) {
          if (result.error) {
            throw new Error(result.error);
          }
          console.log(result.body);
          //let events = [];
          console.log(moment(Date.now()));
          const threeDaysFromNow = moment(Date.now()).add(4, 'd');
          const aWeekFromNow = moment(Date.now()).add(7, 'd');
          const tomorrow = moment(Date.now()).add(1, 'd');
          const events = [];
          const threeDay = result.body.items.map(event => {
            const dateTime = event.start.dateTime;
            const eventName = event.summary;
            const eventLocation = event.location;
            let endTime = threeDaysFromNow;
            if (date.time === 'week') {
              endTime = aWeekFromNow;
            }
            if (date.time === 'today') {
              endTime = tomorrow;
            }
            console.log('moment : ' + moment(dateTime).fromNow() + ' ' + moment(dateTime).isAfter(Date.now()) + ' ' + endTime);
            if (moment(dateTime).isAfter(Date.now())) {
              //events[i] = {"dateTime": dateTime};
              if (moment(dateTime).isBefore(endTime)) {
                const eventMoment = moment(dateTime);
                let time = eventMoment.format('dddd, MMMM Do');
                // return eventName + ' on ' + time + ' at ' + eventLocation;
                events.push(eventName);
                return {
                  'name': eventName,
                  'time': time,
                  'location': eventLocation
                }
              }
            }
          });
          const filteredThreeDay = threeDay.filter(arr => arr);
          console.log(filteredThreeDay);
          const getEventItems = (eventItems) => {
            return eventItems.map((event) => {
              return {
                'title': event.name,
                'description': event.time + " at " + event.location,
                'info': {
                  'key': event.location
                }
              };
            });
          };
          let googleHomeEventString = filteredThreeDay.join(',').toString();
          console.log("Google Home Event String" + googleHomeEventString);

          let eventsText = events.join(',');
        let hereAreTheEvents = 'Here are some upcoming events';

     //    if (date.time === 'today') {
     //      let hereAreTheEvents = 'Here are the events today';
     //    }
     // if (date.time === 'week'){
     //      let hereAreTheEvents = 'Here are the events this week';
     //    }

        let returnedJson = {
            // fulfillment_text: filteredThreeDay.join(', ')
            // // outputContexts: outputContextsVal
            'fulfillmentText': 'Heres whats going on:',
            'fulfillmentMessages': [
              {
                'platform': 'ACTIONS_ON_GOOGLE',
                'carouselSelect':
                  {
                    'items': getEventItems(filteredThreeDay)
                  }
              }
            ],
            "payload": {
              "google": {
                "expectUserResponse": true,
                "richResponse": {
                  "items": [
                    {
                      "simpleResponse": {
                        "displayText": hereAreTheEvents,
                        "textToSpeech": eventsText
                      }
                    }
                  ]
                }
              }
            }
          };
          console.log("Returned JSON: " + JSON.stringify(returnedJson));
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
        fs.readFile(fileName, 'utf8', function (err, data) {
          if (err) {
            return 'No athletics info found';
          }
          const jsonText = parser.toJson(data);
          const games = JSON.parse(jsonText)['scores']['game'];
          const currentTime = moment();
          const nextTime = moment().add(2, 'd');
          console.log('In the next two days: \n');
          const gameString = games.reduce((gameString, currentGame) => {
            const gameTime = moment(currentGame['date'], 'MM-DD-YYYY hh:mm:ss A');
            if (gameTime.isAfter(currentTime) && gameTime.isBefore(nextTime)) {
              const listItem = '- ' + currentGame['sport_abbrev'] + ' at ' + currentGame['date'] + '\n';
              return gameString + listItem;
            }
            return gameString;
          });
          console.log(gameString);
        });
        res.json({
          fulfillment_text: 'Sports Reached'
        });
      }
  }
;
module.exports = EVT_FUNCTION_ACTION_NAME_TO_FUNCTION;
