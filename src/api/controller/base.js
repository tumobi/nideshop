'use strict';

export default class extends think.controller.base {

  /**
   * 前置操作
   */
  async __before() {

    //根据token值获取用户id
    think.token = this.header('X-Nideshop-Token') || '';
    let TokenSerivce = this.service('token');
    let tokenObj = new TokenSerivce();
    think.userId = await tokenObj.getUserId();

    const publicController = this.http.config('publicController');
    const publicAction = this.http.config('publicAction');

    //如果为非公开，则验证用户是否登录
    console.log(this.http.controller + '/' + this.http.action)
    if (!publicController.includes(this.http.controller) && !publicAction.includes(this.http.controller + '/' + this.http.action)) {
      if (think.userId <= 0) {
        return this.fail(401, '请先登录');
      }
    }

  }
}