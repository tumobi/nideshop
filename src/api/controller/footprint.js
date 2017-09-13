const Base = require('./base.js');
const moment = require('moment');
const _ = require('lodash');

module.exports = class extends Base {
  /**
   *
   * @returns {Promise<void|Promise|PreventPromise>}
   */
  async deleteAction() {
    const footprintId = this.post('footprintId');
    const userId = this.getLoginUserId();
    // 删除当天的同一个商品的足迹
    const goods = await this.model('footprint').where({user_id: userId, id: footprintId}).find();
    await this.model('footprint').where({user_id: userId, goods_id: goods.goods_id}).delete();

    return this.success('删除成功');
  }

  /**
   * list action
   * @return {Promise} []
   */
  async listAction() {
    const list = await this.model('footprint')
      .field(['f.*', 'g.name', 'g.list_pic_url', 'g.goods_brief', 'g.retail_price'])
      .alias('f')
      .join({
        table: 'goods',
        join: 'left',
        as: 'g',
        on: ['f.goods_id', 'g.id']
      }).where({user_id: this.getLoginUserId()})
      .order({id: 'desc'})
      .countSelect();

    // 去重、格式化日期、按天分组
    list.data = _.map(_.uniqBy(list.data, function(item) {
      return item.goods_id;
    }), (item) => {
      item.add_time = moment.unix(item.add_time).format('YYYY-MM-DD');
      // 今天
      if (moment().format('YYYY-MM-DD') === item.add_time) {
        item.add_time = '今天';
      }
      // 昨天
      if (moment().subtract(1, 'days').format('YYYY-MM-DD') === item.add_time) {
        item.add_time = '昨天';
      }
      // 前天
      if (moment().subtract(2, 'days').format('YYYY-MM-DD') === item.add_time) {
        item.add_time = '前天';
      }
      return item;
    });

    list.data = _.groupBy(list.data, function(item) {
      return item.add_time;
    });
    list.data = _.values(list.data);

    return this.success(list);
  }
};
