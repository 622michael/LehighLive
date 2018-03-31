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

const modules = {
  'BUS': busModule
};

const send404 = (res) => {
  res.status(404);
  res.send('Page not found');
};

app.post('/', (req, res) => {
  const action = (req.body.queryResult || {}).action;

  const MODULE_NAME_LENGTH_FROM_ACTION = 3;
  const actionInvalid = !action || action.length <= MODULE_NAME_LENGTH_FROM_ACTION;
  if (actionInvalid) {
    send404(res);
    return;
  }
  const moduleName = action.substring(0, MODULE_NAME_LENGTH_FROM_ACTION).toUpperCase();
  const functionName = action.substring(MODULE_NAME_LENGTH_FROM_ACTION);

  const module = modules[moduleName];
  const functionInModule = module[functionName];
  if (module && functionInModule) {
    functionInModule(req, res);
  } else {
    send404(res);
  }
});

app.get('/', (req, res) => {
  console.log('hello');
});
app.get('/rmp',(req, res) => {
    var request = require("request");

var options = { method: 'GET',
    url: 'http://www.ratemyprofessors.com/paginate/professors/ratings',
    qs: { tid: '2076881', page: '0', max: '3', cache: 'false' },
    headers:
        { 'Postman-Token': '297e504c-bf0c-4196-92e6-8c0c8c6c0441',
            'Cache-Control': 'no-cache' } };

request(options, function (error, response, body) {
    if (error) throw new Error(error);

    console.log(body);
    res.send(body);
});

})

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Server up and listening at ' + PORT + '!');
});
