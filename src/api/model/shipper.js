module.exports = class extends think.Model {
  /**
   * 根据快递公司编码获取名称
   * @param shipperCode
   * @returns {Promise.<*>}
   */
  async getShipperNameByCode(shipperCode) {
    return this.where({ code: shipperCode }).getField('name', true);
  }

  /**
   * 根据 id 获取快递公司信息
   * @param shipperId
   * @returns {Promise.<*>}
   */
  async getShipperById(shipperId) {
    return this.where({ id: shipperId }).find();
  }
};
