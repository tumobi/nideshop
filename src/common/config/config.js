'use strict';
/**
 * config
 */
export default {
    //key: value
    default_module: 'api', //设置默认模块
    deny_module_list: [], //设置禁用的模块

    cors: {
        origin: '*',
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        preflightContinue: false
    },
};