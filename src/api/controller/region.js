'use strict';

import Base from './base.js';

export default class extends Base {


  async infoAction(){
    let region = await this.model('region').getRegionInfo(this.get('regionId'));
    return this.success(region);
  }

  async listAction(){
    let regionList = await this.model('region').getRegionList(this.get('parentId'));
    return this.success(regionList);
  }
}