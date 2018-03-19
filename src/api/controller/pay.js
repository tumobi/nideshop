/* eslint-disable no-multi-spaces */
const Base = require('./base.js');
const axios = require('axios');
const cryptoUtil = require('muses-wxmp-crypto-util');
const qs = require('querystring');

module.exports = class extends Base {
  /**
   * 获取支付的请求参数
   * @returns {Promise<PreventPromise|void|Promise>}
   */
  async prepayAction() {
    const orderId = this.get('orderId');

    const orderInfo = await this.model('order').where({ id: orderId }).find();
    if (think.isEmpty(orderInfo)) {
      return this.fail(400, '订单已取消');
    }
    if (parseInt(orderInfo.pay_status) !== 0) {
      return this.fail(400, '订单已支付，请不要重复操作');
    }
    const openid = await this.model('user').where({ id: orderInfo.user_id }).getField('weixin_openid', true);
    if (think.isEmpty(openid)) {
      think.logger.warn('找不到openid');
      return this.fail('微信支付失败');
    }
    const WeixinSerivce = this.service('weixin', 'api');
    try {
      const outTradeNo = orderInfo.order_sn + Math.round(100 * Math.random());
      const returnParams = await WeixinSerivce.createUnifiedOrder({
        openid: openid,
        body: '商户订单：' + orderInfo.order_sn,
        out_trade_no: outTradeNo,
        total_fee: parseInt(orderInfo.actual_price * 100),
        spbill_create_ip: ''
      });
      return this.success(returnParams);
    } catch (err) {
      think.logger.error(err);
      return this.fail('微信支付失败');
    }
  }

  /**
   * 微信支付成功后异步通知
   * @returns {Promise.<string>}
   */
  async notifyAction() {
    const WeixinSerivce = this.service('weixin', 'api');
    const result = WeixinSerivce.payNotify(this.post('xml'));
    if (!result) {
      return `<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[支付失败]]></return_msg></xml>`;
    }

    const orderSn = result.out_trade_no.substring(0, 20);
    const orderModel = this.model('order');
    const orderInfo = await orderModel.getOrderByOrderSn(orderSn);
    if (think.isEmpty(orderInfo)) {
      return `<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[订单不存在]]></return_msg></xml>`;
    }

    if (orderModel.updatePayStatus(orderInfo.id, 2) === 0) {
      return `<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[订单不存在]]></return_msg></xml>`;
    }

    const params = {
      appid: think.config('appService.appid'),
      openid: result.openid,
      action: 'paymentnotify'
    };
    const clientSecret = think.config('appService.appKey');
    const timestamp = new Date().getTime();
    const sign = cryptoUtil.getSignature(params, timestamp, clientSecret);
    axios.post(think.config('appService.host') + '/api/' + think.config('appService.version') +
          '/orders/' + orderInfo.platform_order + '?' + qs.stringify(params), '', {headers: {'Muses-Timestamp': timestamp, 'Muses-Signature': sign}});
    return `<xml><return_code><![CDATA[SUCCESS]]></return_code><return_msg><![CDATA[OK]]></return_msg></xml>`;
  }
};
