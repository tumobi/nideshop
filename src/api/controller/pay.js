'use strict';

import Base from './base.js';
const rp = require("request-promise");
const request = require("request");

export default class extends Base {

    // 支付类型 1 微信支付 2支付宝
    // TODO 支付功能由于没有公司账号和微信支付账号，所以没有经过测试，如您可以提供相关账号测试，可联系 tumobi@163.com

    /**
     * 获取支付信息（订单信息和支持的支付方式信息）
     * @return {Promise} []
     */
    async indexAction() {
        //auto render template file index_index.html
        return this.display();
    }

    /**
     * 获取支付的请求参数
     * @returns {Promise<PreventPromise|void|Promise>}
     */
    async payPrepayAction() {

        const orderId = this.get('orderId');
        const payType = this.get('payType');

        const orderInfo = await this.model('order').where({id: orderId}).find();
        if (think.isEmpty(orderInfo)) {
            return this.fail(400, '订单已取消');
        }
        console.log(orderInfo)
        if (parseInt(orderInfo.pay_status) !== 0) {
            return this.fail(400, '订单已支付，请不要重复操作');
        }

        //微信支付统一调用接口，body参数请查看微信支付文档：https://pay.weixin.qq.com/wiki/doc/api/wxa/wxa_sl_api.php?chapter=9_1
        let options = {
            method: 'POST',
            url: 'https://api.mch.weixin.qq.com/pay/unifiedorder',
            body: {
                appid: 'payload',
                mch_id: '',
                sub_appid: '',
                sub_mch_id: '',
                device_info: '',
                nonce_str: think.uuid(32),
                sign: '',
                sign_type: 'MD5',
                body: '',
                out_trade_no: '',
                total_fee: orderInfo.actual_price * 100,
                spbill_create_ip: '',
                notify_url: '',
                trade_type: 'JSAPI',
                openid: '',
                sub_openid: '',
            },
        };
        //let payParam = await rp(options);

        //统一返回成功，方便测试
        return this.success({
            'timeStamp': getTime(),
            'nonceStr': think.uuid(16),
            'package': 'prepay_id=wx201410272009395522657a690389285100',
            'signType': 'MD5',
            'paySign': 'jdsdlsdsd',
        });
    }

}