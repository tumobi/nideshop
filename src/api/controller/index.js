'use strict';

import Base from './base.js';

export default class extends Base {

  /**
   * 获取分类栏目数据
   * @returns {Promise.<Promise|void|PreventPromise>}
   */
  async indexAction(){

    let banner = await this.model('ad').where({ad_position_id: 1}).select();
    let channel = await this.model('channel').order({ sort_order: 'asc'}).select();
    let newGoods = await this.model('goods').field(['id', 'name', 'list_pic_url', 'retail_price']).where({is_new: 1}).limit(4).select();
    let hotGoods = await this.model('goods').field(['id', 'name', 'list_pic_url', 'retail_price', 'goods_brief']).where({is_hot: 1}).limit(3).select();
    let brandList = await this.model('brand').where({is_new: 1}).order({new_sort_order: 'asc'}).limit(4).select();
    let topicList = await this.model('topic').limit(3).select();

    let categoryList = await this.model('category').where({parent_id: 0, name: ['<>', '推荐']}).select();
    let newCategoryList = [];
    for (let categoryItem of categoryList) {
      let childCategoryIds = await this.model('category').where({parent_id: categoryItem.id}).getField('id', 100);
      let categoryGoods = await this.model('goods').field(['id', 'name', 'list_pic_url', 'retail_price']).where({category_id: ['IN', childCategoryIds]}).limit(7).select();
      newCategoryList.push({
          id: categoryItem.id,
          name: categoryItem.name,
          goodsList: categoryGoods
      });
    }

    return this.success({
        banner: banner,
        channel: channel,
        newGoodsList: newGoods,
        hotGoodsList: hotGoods,
        brandList: brandList,
        topicList: topicList,
        categoryList: newCategoryList
    });
    // return this.success(jsonData);
  }
}