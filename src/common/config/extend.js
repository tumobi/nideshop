const model = require('think-model');
const cache = require('think-cache');
const session = require('think-session');

module.exports = [
  model(think.app),
  cache,
  session
];
