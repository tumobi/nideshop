'use strict';
/**
 * model
 */
export default class extends think.model.base {

  async addFootprint(goodsId){

    //用户已经登录才可以添加到足迹
    let userId = getLoginUserId();

    if (userId > 0) {

      await this.add({
        goods_id: goodsId,
        user_id: userId,
        add_time: getTime()
      });

    }
  }
}