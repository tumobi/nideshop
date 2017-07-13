'use strict';

import Base from './base.js';

export default class extends Base {
  /**
   * index action
   * @return {Promise} []
   */
  indexAction(){
    //auto render template file index_index.html
    return this.display();
  }

  async listAction(){

    let typeId = this.post('typeId');

    let list = await this.model('collect')
      .field(['c.*', 'g.name', 'g.list_pic_url', 'g.goods_brief', 'g.retail_price'])
      .alias('c')
      .join({
        table: 'goods',
        join: 'left', //join 方式，有 left, right, inner 3 种方式
        as: 'g', // 表别名
        on: ['c.value_id', 'g.id'] //ON 条件
      }).where({user_id: getLoginUserId(), type_id: typeId}).countSelect();


    return this.success(list);
  }

  async addordeleteAction(){
    let typeId = this.post('typeId');
    let valueId = this.post('valueId');

    let collect = await this.model('collect').where({type_id: typeId, value_id: valueId, user_id: 1}).find();
    let collectRes = null;
    let handleType = 'add';
    if (think.isEmpty(collect)) {
      //添加收藏
        collectRes = await this.model('collect').add({
            type_id: typeId,
            value_id: valueId,
            user_id: 1,
            add_time: parseInt(new Date().getTime() / 1000)
        });
    } else {
      //取消收藏
        collectRes = await this.model('collect').where({id: collect.id}).delete();
        handleType = 'delete';
    }

    if ( collectRes > 0) {
        return this.success({type: handleType});
    }

    return this.fail('操作失败');
  }
}