module.exports = class extends think.Model {
  /**
   * 获取购物车的商品
   * @returns {Promise.<*>}
   */
  async getGoodsList() {
    const goodsList = await this.model('cart').where({user_id: think.userId, session_id: 1}).select();
    return goodsList;
  }

  /**
   * 获取购物车的选中的商品
   * @returns {Promise.<*>}
   */
  async getCheckedGoodsList() {
    const goodsList = await this.model('cart').where({user_id: think.userId, session_id: 1, checked: 1}).select();
    return goodsList;
  }

  /**
   * 清空已购买的商品
   * @returns {Promise.<*>}
   */
  async clearBuyGoods() {
    const $res = await this.model('cart').where({user_id: think.userId, session_id: 1, checked: 1}).delete();
    return $res;
  }
};
