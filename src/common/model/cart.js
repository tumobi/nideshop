'use strict';
/**
 * model
 */
export default class extends think.model.base {

  /**
   * 获取购物车的商品
   * @returns {Promise.<*>}
   */
  async getGoodsList(){
    return await this.model('cart').where({user_id: think.userId, session_id: 1}).select();
  }

  /**
   * 获取购物车的选中的商品
   * @returns {Promise.<*>}
   */
  async getCheckedGoodsList(){
    return await this.model('cart').where({user_id: think.userId, session_id: 1, checked: 1}).select();
  }

    /**
     * 清空已购买的商品
     * @returns {Promise.<*>}
     */
  async clearBuyGoods(){
      return await this.model('cart').where({user_id: think.userId, session_id: 1, checked: 1}).delete();
  }
}