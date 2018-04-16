const menu = require('./menu');
const times = require('./times');

const EVT_FUNCTION_ACTION_NAME_TO_FUNCTION = {
  ...menu,
  ...times,
};

module.exports = EVT_FUNCTION_ACTION_NAME_TO_FUNCTION;
