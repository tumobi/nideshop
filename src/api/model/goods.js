module.exports = class extends think.Model {
  /**
   * 获取商品的product
   * @param goodsId
   * @returns {Promise.<*>}
   */
  async getProductList(goodsId) {
    const goods = await this.model('product').where({goods_id: goodsId}).select();
    return goods;
  }

  /**
   * 获取商品的规格信息
   * @param goodsId
   * @returns {Promise.<Array>}
   */
  async getSpecificationList(goodsId) {
    // 根据sku商品信息，查找规格值列表
    const specificationRes = await this.model('goods_specification').alias('gs')
      .field(['gs.*', 's.name'])
      .join({
        table: 'specification',
        join: 'inner',
        as: 's',
        on: ['specification_id', 'id']
      })
      .where({goods_id: goodsId}).select();

    const specificationList = [];
    const hasSpecificationList = {};
    // 按规格名称分组
    for (let i = 0; i < specificationRes.length; i++) {
      const specItem = specificationRes[i];
      if (!hasSpecificationList[specItem.specification_id]) {
        specificationList.push({
          specification_id: specItem.specification_id,
          name: specItem.name,
          valueList: [specItem]
        });
        hasSpecificationList[specItem.specification_id] = specItem;
      } else {
        for (let j = 0; j < specificationList.length; j++) {
          if (specificationList[j].specification_id === specItem.specification_id) {
            specificationList[j].valueList.push(specItem);
            break;
          }
        }
      }
    }

    return specificationList;
  }
};
