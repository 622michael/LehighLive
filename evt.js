const EVT_FUNCTION_ACTION_NAME_TO_FUNCTION = {
    'today': (req, res) => {
        console.log("Event Today reached");
        var request = require('request');

        var headers = {
            'cookie': 'S=billing-ui-v3=QvsQIUsBvrJD-JQ-8pAnMwU2C2bm2i5p:billing-ui-v3-efe=QvsQIUsBvrJD-JQ-8pAnMwU2C2bm2i5p; SID=-AXV51du6EQOuitYHUYDlv0o4RtfAppOHz26zqxYf5w26Fj5EXfqCCve4oFJrP90_DbkiQ.; HSID=Ac_u1Kki42lENgks3; SSID=AUsrwkpwL5VDttBdU; APISID=IqsIvFzf0XF2m2d3/AjZTeZygwTMVZMdsr; SAPISID=TJYHF9P9-blLp5ZQ/Aze9SQpxeMf2cJWRs; NID=127=mG6mSeiJ4nBEHzP6xd0WSQ8g2_9GM-RiHjU8tKKtx1ySD6-8aw6QOewgAtVMZwxbd5xq0GUP07wHfycnIeyltfFXWwwxgkoMV3r0WE6nSYwMN9mRSkn40wdgIv0lu9BUZg4Q9qxFcZmuNJrR1GW1g3W1HO1UDufIJLy7lBiBH8oy2xFdXt7XlQVQtBTTtx-cz3nVI_KJgdGW1TXcgrkYPF8RnC6iYkPGYJ4pQz8GlE7mkXnA1_sLxyYSeg26viSCaxxRZ5iO4rOLrL6e; 1P_JAR=2018-4-6-19; SIDCC=AEfoLeY-MGu9cf2zKT_omlozo5psNvBzSULmN5mvgfzP5Sh_TQkMvBZgpHRTLKXXAaiKkV4fn3k',
            'x-goog-encode-response-if-executable': 'base64',
            'accept-encoding': 'gzip, deflate, br',
            'x-origin': 'https://calendar.google.com',
            'accept-language': 'en-US,en;q=0.9',
            'authorization': 'SAPISIDHASH 1523041865_db1e26f0511fdea1c7ae5a54c7cd3dbc09effaf5',
            'x-requested-with': 'XMLHttpRequest',
            'x-client-data': 'CK61yQEIjLbJAQimtskBCMG2yQEIqZ3KAQiyncoBCKijygEYkqPKAQ==',
            'x-goog-authuser': '0',
            'x-clientdetails': 'appVersion=5.0%20(Macintosh%3B%20Intel%20Mac%20OS%20X%2010_13_3)%20AppleWebKit%2F537.36%20(KHTML%2C%20like%20Gecko)%20Chrome%2F65.0.3325.181%20Safari%2F537.36&platform=MacIntel&userAgent=Mozilla%2F5.0%20(Macintosh%3B%20Intel%20Mac%20OS%20X%2010_13_3)%20AppleWebKit%2F537.36%20(KHTML%2C%20like%20Gecko)%20Chrome%2F65.0.3325.181%20Safari%2F537.36',
            'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36',
            'accept': '*/*',
            'referer': 'https://clients6.google.com/static/proxy.html?usegapi=1&jsh=m%3B%2F_%2Fscs%2Fapps-static%2F_%2Fjs%2Fk%3Doz.gapi.en.j5eA2OggHfc.O%2Fm%3D__features__%2Fam%3DAQ%2Frt%3Dj%2Fd%3D1%2Frs%3DAGLTcCMv9KPPcflLNWdRK9za8j9skel9nA',
            'authority': 'clients6.google.com',
            'x-javascript-user-agent': 'google-api-javascript-client/1.1.0',
            'x-referer': 'https://calendar.google.com'
        };

        var options = {
            url: 'https://clients6.google.com/calendar/v3/calendars/indark@lehigh.edu/events?calendarId=indark%40lehigh.edu&singleEvents=true&timeZone=America%2FNew_York&maxAttendees=1&maxResults=250&sanitizeHtml=true&timeMin=2018-04-06T00%3A00%3A00-04%3A00&timeMax=2018-05-15T00%3A00%3A00-04%3A00&key=AIzaSyBNlYH01_9Hc5S1J9vuFmu2nUqBZJNAXxs',
            headers: headers
        };

        function callback(error, response, body) {
            if (!error && response.statusCode == 200) {
                console.log(body);
                console.log(error);
                console.log(response.toString());
            }
        }

        request(options, callback);


        res.json({
            fulfillment_text: 'The calendar request was successful!'
        });
    },
};

module.exports = EVT_FUNCTION_ACTION_NAME_TO_FUNCTION;
