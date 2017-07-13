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

    let model = this.model('topic');
    let data = await model.field(['id', 'title', 'price_info', 'scene_pic_url', 'subtitle']).page(this.get('page') || 1, this.get('size') || 10).countSelect();

    return this.success(data);
  }

  async detailAction(){

    let model = this.model('topic');
    let data = await model.where({id: this.get('id')}).find();

    return this.success(data);
  }

    async relatedAction(){

        let model = this.model('topic');
        let data = await model.field(['id', 'title', 'price_info', 'scene_pic_url', 'subtitle']).limit(4).select();

        return this.success(data);
    }

}