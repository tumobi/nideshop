'use strict';

import Base from './base.js';
let moment = require('moment');
let _ = require('lodash');

export default class extends Base {

    /**
     *
     * @returns {Promise<void|Promise|PreventPromise>}
     */
    async deleteAction(){
        let footprintId = this.post('footprintId');
        let userId = getLoginUserId();
        //删除当天的同一个商品的足迹
        let goods = await this.model('footprint').where({user_id: userId, id: footprintId}).find();
        await this.model('footprint').where({user_id: userId, goods_id: goods.goods_id}).delete();

        return this.success('删除成功');
    }

    /**
     * list action
     * @return {Promise} []
     */
    async listAction() {

        let list = await this.model('footprint')
            .field(['f.*', 'g.name', 'g.list_pic_url', 'g.goods_brief', 'g.retail_price'])
            .alias('f')
            .join({
                table: 'goods',
                join: 'left', //join 方式，有 left, right, inner 3 种方式
                as: 'g', // 表别名
                on: ['f.goods_id', 'g.id'] //ON 条件
            }).where({user_id: getLoginUserId()})
            .order({id: 'desc'})
            .countSelect();

        //去重、格式化日期、按天分组
        list.data = _.map(_.uniqBy(list.data, function (item) {
            return item.goods_id;
        }), (item) => {
            item.add_time = moment.unix(item.add_time).format('YYYY-MM-DD');
            //今天
            if (moment().format('YYYY-MM-DD') == item.add_time) {
                item.add_time = '今天';
            }
            //昨天
            if (moment().subtract(1, 'days').format('YYYY-MM-DD') == item.add_time) {
                item.add_time = '昨天';
            }
            //前天
            if (moment().subtract(2, 'days').format('YYYY-MM-DD') == item.add_time) {
                item.add_time = '前天';
            }
            return item;
        });

        list.data = _.groupBy(list.data, function (item) {
            return item.add_time;
        });
        list.data = _.values(list.data);

        return this.success(list);
    }
}