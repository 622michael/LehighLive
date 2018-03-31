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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Server up and listening at ' + PORT + '!');
});
