'use strict';

export default class extends think.controller.base {

  /**
   * 前置操作
   */
  async __before() {

    think.token = this.header('X-Nideshop-Token') || '';
    if (!think.isEmpty(think.token)) {
      let TokenSerivce = this.service('token');
      let tokenObj = new TokenSerivce();
      let sessionInfo = await tokenObj.parse();

      console.log(sessionInfo)
      if (!think.isEmpty(sessionInfo) && sessionInfo.user_id > 0) {
        think.userId = sessionInfo.user_id;
      } else {
        think.userId = 0;
      }
    } else {
      think.userId = 0;
    }
  }
}