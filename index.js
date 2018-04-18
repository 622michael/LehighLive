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
const evtModule = require('./evt');
const dinModule = require('./dining/din');
const modules = {
    'BUS': busModule,
    'PRO': proModule,
    'EVT': evtModule,
    'DIN': dinModule
};

const send404 = (res) => {
    res.status(404);
    res.send('Hello');
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

    }else {
        send404(res);
    }
});

app.get('/', (req, res) => {
    res.send('hello awesome peeps');
});

app.get('/rmp', (req, res) => {

});

app.get('/din', (req, res) => {

});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('Server up and listening at ' + PORT + '!');
});
