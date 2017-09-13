const Base = require('./base.js');

module.exports = class extends Base {
  async infoAction() {
    const region = await this.model('region').getRegionInfo(this.get('regionId'));
    return this.success(region);
  }

  async listAction() {
    const regionList = await this.model('region').getRegionList(this.get('parentId'));
    return this.success(regionList);
  }
};
