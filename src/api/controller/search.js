'use strict';

import Base from './base.js';

export default class extends Base {
  /**
   * index action
   * @return {Promise} []
   */
  async indexAction(){

    let defaultKeyword = await this.model('keywords').where({is_default: 1}).limit(1).find();
    let historyKeywordList = await this.model('keywords').distinct('keyword').where({user_id: 1}).limit(10).getField('keyword');
    let hotKeywordList = await this.model('keywords').distinct('keyword').field(['keyword', 'is_hot']).limit(10).select();
    return this.success({
        defaultKeyword: defaultKeyword,
        historyKeywordList: historyKeywordList,
        hotKeywordList: hotKeywordList
    });
  }

  async helperAction(){
    let keyword = this.get('keyword');
    let keywords = await this.model('keywords').distinct('keyword').where({keyword: ['like', keyword + '%']}).getField('keyword', 10);
    return this.success(keywords);
  }

  async resultAction(){
    let keyword = this.get('keyword');
    let page = this.get('page') | 1;
    let size = this.get('size') | 50;
    let sort = this.get('sort') | 'id';  //排序的字段 综合 价格 分类
    let order = this.get('order') | 'desc';
    let categoryId = this.get('categoryId');

    if (!think.isEmpty(keyword)) {
        let keywords = await this.model('keywords').add({
            keyword: keyword,
            user_id: 1,
            search_time: parseInt(new Date().getTime() / 1000)
        });
    }


    let goodsList = await this.model('goods').field(['id', 'name', 'category_id', 'retail_price', 'list_pic_url']).where({name: ['like', `%${keyword}%`]}).select();
    let categoryIds = await this.model('goods').where({name: ['like', `%${keyword}%`]}).getField('category_id', 1000);
    let parentCategoryIds = await this.model('category').where({id: ['in', categoryIds]}).getField('parent_id');
    let parentCategory = await this.model('category').where({parent_id: 0, id: ['in', parentCategoryIds]}).select();

    return this.success({
        categoryList: parentCategory,
        goodsList: goodsList,
        sort: sort,
        order: order,
        categoryId: categoryId
    });
  }
}