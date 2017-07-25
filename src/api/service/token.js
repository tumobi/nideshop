'use strict';

const jwt = require('jsonwebtoken');

const secret = think.config('session.secret');

export default class extends think.service.base {
  /**
   * init
   * @return {}         []
   */
  init(...args) {
    super.init(...args);
  }

  /**
   * 根据header中的X-Nideshop-Token值获取用户id
   */
  async getUserId() {

    const token = think.token;

    if (!token) {
      return 0;
    }

    let result = await this.parse();

    if (think.isEmpty(result) || result.user_id <= 0) {
      return 0;
    }

    return result.user_id;
  }

  /**
   * 根据值获取用户信息
   */
  async getUserInfo() {

    let userId = await this.getUserId();
    if (userId <= 0) {
      return null;
    }

    let userInfo = await this.model('user').field(['id', 'username', 'nickname', 'gender', 'avatar', 'birthday']).where({ id: userId }).find();

    return think.isEmpty(userInfo) ? null : userInfo;
  }

  async create(userInfo) {
    let token = jwt.sign(userInfo, secret);
    return token;
  }

  async parse() {
    if (think.token) {
      try {
        return jwt.verify(think.token, secret);
      } catch (err) {
        return null;
      }
    }
    return null;
  }

  async verify() {
    let result = await this.parse();
    if (think.isEmpty(result)) {
      return false;
    }

    return true;
  }
}