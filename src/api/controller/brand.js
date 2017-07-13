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

    let model = this.model('brand');
    let data = await model.field(['id', 'name', 'floor_price', 'app_list_pic_url']).page(this.get('page') || 1, this.get('size') || 10).countSelect();

    return this.success(data);
  }

  async detailAction(){

    let model = this.model('brand');
    let data = await model.where({id: this.get('id')}).find();

    return this.success({brand: data});
  }

}