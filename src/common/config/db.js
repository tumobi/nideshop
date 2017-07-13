'use strict';
/**
 * db config
 * @type {Object}
 */
export default {
  type: 'mysql',
  adapter: {
    mysql: {
      host: '127.0.0.1',
      port: '3306',
      database: 'nideshop',
      user: 'root',
      password: 'root',
      prefix: 'nideshop_',
      encoding: 'utf8'
    },
    mongo: {

    }
  }
};