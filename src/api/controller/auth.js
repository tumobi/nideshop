'use strict';

import Base from './base.js';
const rp = require("request-promise");
const request = require("request");
const fs = require('fs');
const _ = require('lodash');

export default class extends Base {
  /**
   * index action
   * @return {Promise} []
   */
  async indexAction() {

    let avatar_path = think.RESOURCE_PATH + '/static/user/avatar/1.' + _.last(_.split('https://img6.bdstatic.com/img/image/smallpic/liutaoxiaotu.jpg', '.'));
    //rp('https://img6.bdstatic.com/img/image/smallpic/liutaoxiaotu.jpg').pipe(fs.createWriteStream(avatar_path));
    return this.success(avatar_path);
  }

  async loginAction() {

    let code = this.post('code');
    let userInfo = this.post('userInfo');

    //获取openid
    let options = {
      method: 'GET',
      url: 'https://api.weixin.qq.com/sns/jscode2session',
      qs: {
        grant_type: 'authorization_code',
        js_code: code,
        secret: '00a2749d6f15e1979194d80b777e6adf',
        appid: 'wx262f4ac3b1c477dd'
      }
    };

    let sessionData = await rp(options);


    //下载微信用户的头像到本地
    // let avatar_path = think.RESOURCE_PATH + '/static/user/avatar/1.' + _.last(_.split('https://img6.bdstatic.com/img/image/smallpic/liutaoxiaotu.jpg', '.'));
    // rp('https://img6.bdstatic.com/img/image/smallpic/liutaoxiaotu.jpg').pipe(fs.createWriteStream(avatar_path));
    sessionData = JSON.parse(sessionData);
    if (!sessionData.openid) {
      return this.fail('登录失败');
    }

    //根据openid查找用户是否已经注册
    let userId = await this.model('user').where({weixin_openid: sessionData.openid}).getField('id', true);
    if (think.isEmpty(userId)) {
      //注册
      userId = await this.model('user').add({
        username: '微信用户' + sessionData.openid.substr(0, 6),
        password: sessionData.openid,
        register_time: parseInt(new Date().getTime() / 1000),
        register_ip: this.ip(),
        weixin_openid: sessionData.openid,
        avatar: userInfo.avatarUrl,
        sex: userInfo.gender, //性别 0：未知、1：男、2：女
        nickname: userInfo.nickName
      });
    }

    sessionData.user_id = userId;

    //查询用户信息
    let newUserInfo = await this.model('user').field(['id', 'username', 'nickname', 'gender', 'avatar', 'birthday']).where({id: userId}).find();

    let sessionKey = think.uuid(128);

    if (think.isEmpty(newUserInfo) || think.isEmpty(sessionKey)) {
      return this.fail('登录失败');
    }

    //保存openid到redis
    await think.cache(sessionKey, sessionData, {timeout: 5400});

    return this.success({token: sessionKey, userInfo: newUserInfo});
  }

  async logoutAction() {
    await think.cache(this.header('token'), null);
    return this.success();
  }
}