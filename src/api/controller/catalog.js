'use strict';

import Base from './base.js';

export default class extends Base {
  /**
   * 获取分类栏目数据
   * @returns {Promise.<Promise|void|PreventPromise>}
   */
  async indexAction(){

    let categoryId = this.get('id');

    let model = this.model('category');
    let data = await model.limit(10).select();

    let currentCategory = null;
    if (categoryId) {
      currentCategory = await model.where({'id' : categoryId}).find();
    }

    if (think.isEmpty(currentCategory)) {
      currentCategory = data[0];
    }

    //获取子分类数据
    if (currentCategory && currentCategory.id) {
      currentCategory.subCategoryList = await model.where({'parent_id': currentCategory.id}).select();
    }

    return this.success({
      categoryList: data,
      currentCategory: currentCategory
    });
  }

  async currentAction(){

    let categoryId = this.get('id');

    let model = this.model('category');

    let currentCategory = null;
    if (categoryId) {
      currentCategory = await model.where({'id' : categoryId}).find();
    }

    //获取子分类数据
    if (currentCategory && currentCategory.id) {
      currentCategory.subCategoryList = await model.where({'parent_id': currentCategory.id}).select();
    }

    return this.success({
      currentCategory: currentCategory
    });
  }
}