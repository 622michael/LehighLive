const express = require('express');
const app = express();

const bodyParser = require('body-parser');

app.use(
    bodyParser.urlencoded({
        extended: true
    })
);

app.use(bodyParser.json());

const busModule = require('./bus');
const proModule = require('./professor');
const modules = {
    'BUS': busModule,
    'PRO': proModule
};

const send404 = (res) => {
    res.status(404);
    res.send('Page not found');
};

app.post('/', (req, res) => {
    const action = (req.body.queryResult || {}).action;
    console.log("action: "  + action);
    const MODULE_NAME_LENGTH_FROM_ACTION = 3;
    const actionInvalid = !action || action.length <= MODULE_NAME_LENGTH_FROM_ACTION;
    if (actionInvalid) {
        send404(res);
        return;
    }
    const moduleName = action.substring(0, MODULE_NAME_LENGTH_FROM_ACTION).toUpperCase();
    console.log("moduleName: "  + moduleName);
    const functionName = action.substring(MODULE_NAME_LENGTH_FROM_ACTION);
    console.log("functionName: "  + functionName);

    const module = modules[moduleName];
    const functionInModule = module[functionName];
    if (module && functionInModule) {
        functionInModule(req, res);
    } else {
        send404(res);
    }
});

app.get('/', (req, res) => {
    res.send('hello awesome peeps');
});

app.get('/rmp', (req, res) => {
    const request = require('request');

    var headers1 = {
        'Accept-Encoding': 'gzip, deflate',
        'Accept-Language': 'en-US,en;q=0.9',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36',
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Referer': 'http://www.ezsemester.com/courses',
        'X-Requested-With': 'XMLHttpRequest',
        'Connection': 'keep-alive',
        'Cookie': 'session=eyJwYXNzcG9ydCI6eyJ1c2VyIjp7ImlkIjoiMTEyODE0NjI1NDU3OTA2OTc3NTQzIiwiZW1haWwiOiJjY2kyMTlAbGVoaWdoLmVkdSIsImRpc3BsYXlOYW1lIjoiQ2hhcmxlcyBJbndhbGQiLCJpbWdVcmwiOiJodHRwczovL2xoNi5nb29nbGV1c2VyY29udGVudC5jb20vLUUwS1E3c1NaV3NrL0FBQUFBQUFBQUFJL0FBQUFBQUFBQUhFL3V1dk55dUtleW0wL3Bob3RvLmpwZz9zej01MCJ9fX0=; session.sig=NtCl0DuIyPUyKYM-YxecMPaimyo'
    };

    var options1 = {
        url: 'http://www.ezsemester.com/student/takes',
        headers: headers1
    };

    function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log(body);
            var parsed = JSON.parse(body);
            console.log("Rating" + parsed[0]['rating']);
        }
    }

    request(options1, callback);

    const options = {
        method: 'GET',
        url: 'http://www.ratemyprofessors.com/paginate/professors/ratings',
        qs: {tid: '2076881', page: '0', max: '3', cache: 'false'},
        headers:
            {
                'Cache-Control': 'no-cache'
            }
    };
    request(options, (error, response, body) => {
        if (error) {
            throw new Error(error);
        }
        var parsed = JSON.parse(body);
        console.log(parsed);
        // console.log(body);
        let comment = parsed.ratings[0].rComments;
        console.log(comment);
        res.send(comment);
    });
});

app.get('/din', (req, res) => {

});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('Server up and listening at ' + PORT + '!');
});
