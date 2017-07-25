/**
 * this file will be loaded before server started
 * you can define global functions used in controllers, models, templates
 */

/**
 * use global.xxx to define global functions
 * 
 * global.fn1 = function(){
 *     
 * }
 */

const _ = require('lodash');

/**
 * 获取当前的时间戳（秒数）
 * @returns {Number}
 */
global.getTime = function () {
  return _.parseInt(_.now() / 1000);
};

global.getLoginUserId = function () {
  return think.userId 
};