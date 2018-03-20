const model = require('think-model');
const cache = require('think-cache');

module.exports = [
  model(think.app),
  cache
];
