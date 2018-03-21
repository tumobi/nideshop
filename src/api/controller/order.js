const Base = require('./base.js');
const moment = require('moment');
const axios = require('axios');
const cryptoUtil = require('muses-wxmp-crypto-util');
const qs = require('querystring');

module.exports = class extends Base {
  /**
   * 获取订单列表
   * @return {Promise} []
   */
  async listAction() {
    const orderList = await this.model('order').where('user_id=' + think.userId + ' and order_status not in (101, 102)')
      .order({id: 'desc'}).page(1, 10).countSelect();
    const newOrderList = [];
    for (const item of orderList.data) {
      // 订单的商品
      item.goodsList = await this.model('order_goods').where({ order_id: item.id }).select();
      item.goodsCount = 0;
      item.goodsList.forEach(v => {
        item.goodsCount += v.number;
      });

      // 订单状态的处理
      item.order_status_text = await this.model('order').getOrderStatusText(item.id);

      // 可操作的选项
      item.handleOption = await this.model('order').getOrderHandleOption(item.id);

      newOrderList.push(item);
    }
    orderList.data = newOrderList;

    return this.success(orderList);
  }

  async detailAction() {
    const orderId = this.get('orderId');
    const orderInfo = await this.model('order').where({ user_id: think.userId, id: orderId }).find();

    if (think.isEmpty(orderInfo)) {
      return this.fail('订单不存在');
    }

    orderInfo.province_name = await this.model('region').where({ id: orderInfo.province }).getField('name', true);
    orderInfo.city_name = await this.model('region').where({ id: orderInfo.city }).getField('name', true);
    orderInfo.district_name = await this.model('region').where({ id: orderInfo.district }).getField('name', true);
    orderInfo.full_region = orderInfo.province_name + orderInfo.city_name + orderInfo.district_name;

    const latestExpressInfo = await this.model('order_express').getLatestOrderExpress(orderId);
    orderInfo.express = latestExpressInfo;

    const orderGoods = await this.model('order_goods').where({ order_id: orderId }).select();

    // 订单状态的处理
    orderInfo.order_status_text = await this.model('order').getOrderStatusText(orderId);
    orderInfo.add_time = moment.unix(orderInfo.add_time * 1000).format('YYYY-MM-DD HH:mm:ss');
    orderInfo.final_pay_time = moment('001234', 'Hmmss').format('mm:ss');
    // 订单最后支付时间
    if (orderInfo.order_status === 0) {
      // if (moment().subtract(60, 'minutes') < moment(orderInfo.add_time)) {
      orderInfo.final_pay_time = moment('001234', 'Hmmss').format('mm:ss');
      // } else {
      //     //超过时间不支付，更新订单状态为取消
      // }
    }

    // 订单可操作的选择,删除，支付，收货，评论，退换货
    const handleOption = await this.model('order').getOrderHandleOption(orderId);

    return this.success({
      orderInfo: orderInfo,
      orderGoods: orderGoods,
      handleOption: handleOption
    });
  }

  /**
   * 取消订单API
   * @returns {Promise.<boolean>}
   */
  async cancelAction() {
    const orderId = this.get('orderId');
    const orderInfo = await this.model('order').where({ user_id: think.userId, id: orderId }).find();

    if (think.isEmpty(orderInfo)) {
      return this.fail('订单不存在');
    }

    const row = await this.model('order').cancelOrder(orderId);

    return this.success({
      'result': row > 0
    });
  }

  /**
   * 提交订单
   * @returns {Promise.<void>}
   */
  async submitAction() {
    // 获取收货地址信息和计算运费
    const addressId = this.post('addressId');
    const checkedAddress = await this.model('address').where({ id: addressId }).find();
    if (think.isEmpty(checkedAddress)) {
      return this.fail('请选择收货地址');
    }
    checkedAddress.province_name = await this.model('region').getRegionName(checkedAddress.province_id);
    checkedAddress.city_name = await this.model('region').getRegionName(checkedAddress.city_id);
    checkedAddress.district_name = await this.model('region').getRegionName(checkedAddress.district_id);
    const freightPrice = 0.00;

    // 获取要购买的商品
    const checkedGoodsList = await this.model('cart').where({ user_id: think.userId, session_id: 1, checked: 1 }).select();
    if (think.isEmpty(checkedGoodsList)) {
      return this.fail('请选择商品');
    }

    // 下单的顾客信息
    const currUser = await this.model('user').where({ id: think.userId }).find();

    // 统计商品总价及生成订单内容描述
    let goodsTotalPrice = 0.00;
    let orderDesc = '';
    for (const cartItem of checkedGoodsList) {
      goodsTotalPrice += cartItem.number * cartItem.retail_price;
      orderDesc += ';' + cartItem.goods_name + ',数量:' + cartItem.number;
    }

    // 获取订单使用的优惠券
    const couponId = this.post('couponId');
    // 获取可用的优惠券信息，功能还示实现
    const couponInfo = await this.model('user_coupon').where({user_id: think.userId, id: couponId, used_time: 0}).find();
    let couponPrice = 0.00;
    if (!think.isEmpty(couponInfo)) {
      couponPrice = await this.model('coupon').where({
        id: couponInfo.coupon_id
      }).getField('type_money', true);
    }

    // 订单价格计算
    const orderTotalPrice = goodsTotalPrice + freightPrice; // 订单的总价
    const actualPrice = orderTotalPrice - couponPrice; // 减去其它支付的金额后，要实际支付的金额
    const currentTime = parseInt(this.getTime() / 1000);

    const orderInfo = {
      order_sn: this.model('order').generateOrderNumber(),
      user_id: think.userId,

      // 收货地址和运费
      consignee: checkedAddress.name,
      mobile: checkedAddress.mobile,
      province: checkedAddress.province_id,
      city: checkedAddress.city_id,
      district: checkedAddress.district_id,
      address: checkedAddress.address,
      freight_price: freightPrice,

      // 留言
      postscript: this.post('postscript'),

      // 使用的优惠券
      coupon_id: 0,
      coupon_price: couponPrice,

      add_time: currentTime,
      goods_price: goodsTotalPrice,
      order_price: orderTotalPrice,
      actual_price: actualPrice,
      platform_order: ''
    };

    // 提交订单信息到platform
    const submitData = {
      'orderInfo': orderInfo,
      'userInfo': currUser,
      'description': orderDesc,
      'orderSubject': think.config('appService.appName') + ':' + orderInfo.order_sn,
      'deliveryAddress': checkedAddress.province_name + ' ' + checkedAddress.city_name + ' ' +
      checkedAddress.district_name + ' ' + orderInfo.address + ' ' + orderInfo.consignee
    };

    // 组织订单数据提交到muses的APP服务，创建platform后台订单
    const openid = currUser.weixin_openid; // await this.model('user').where({ id: orderInfo.user_id }).getField('weixin_openid', true);
    if (think.isEmpty(openid)) {
      return this.fail('请先登入帐户');
    }
    const params = {
      appid: think.config('appService.appid'),
      openid: openid,
      orderno: orderInfo.order_sn
    };
    const clientSecret = think.config('appService.appKey');
    const timestamp = new Date().getTime();
    const sign = cryptoUtil.getSignature(params, timestamp, clientSecret);
    await axios.post(think.config('appService.host') + '/api/' + think.config('appService.version') +
        '/orders?' + qs.stringify(params), submitData, {headers: {'Muses-Timestamp': timestamp, 'Muses-Signature': sign}})
      .then(res => {
        think.logger.debug('result Json=' + JSON.stringify(res.data));
        const resJson = res.data;
        if (resJson.result === false) {
          return this.fail('创建订单失败');
        }
        orderInfo.platform_order = resJson.data.orderNo;
      });

    think.logger.info('orderInfo Json=' + JSON.stringify(orderInfo));
    // 开启事务，插入订单信息和订单商品
    const orderId = await this.model('order').add(orderInfo);
    orderInfo.id = orderId;
    if (!orderId) {
      return this.fail('订单提交失败');
    }

    // 统计商品总价
    const orderGoodsData = [];
    for (const goodsItem of checkedGoodsList) {
      orderGoodsData.push({
        order_id: orderId,
        goods_id: goodsItem.goods_id,
        goods_sn: goodsItem.goods_sn,
        product_id: goodsItem.product_id,
        goods_name: goodsItem.goods_name,
        list_pic_url: goodsItem.list_pic_url,
        market_price: goodsItem.market_price,
        retail_price: goodsItem.retail_price,
        number: goodsItem.number,
        goods_specifition_name_value: goodsItem.goods_specifition_name_value,
        goods_specifition_ids: goodsItem.goods_specifition_ids
      });
    }

    await this.model('order_goods').addMany(orderGoodsData);
    await this.model('cart').clearBuyGoods();

    return this.success({ orderInfo: orderInfo });
  }

  async buynowAction() {
    // 获取收货地址信息和计算运费
    const addressId = this.post('addressId');
    const couponId = this.post('couponId'); // 使用的优惠券id
    const goodId = this.post('goodsId');
    const specKey = this.post('specKey');
    const goodNumber = this.post('number');

    const checkedAddress = await this.model('address').where({ id: addressId }).find();
    if (think.isEmpty(checkedAddress)) {
      return this.fail('请选择收货地址');
    }
    checkedAddress.province_name = await this.model('region').getRegionName(checkedAddress.province_id);
    checkedAddress.city_name = await this.model('region').getRegionName(checkedAddress.city_id);
    checkedAddress.district_name = await this.model('region').getRegionName(checkedAddress.district_id);
    // 根据收货地址计算运费
    const freightPrice = 0.00;

    // 获取产品及规格
    const product = await this.model('goods').getProductByKey(goodId, specKey);
    if (think.isEmpty(product)) {
      return this.fail('获取产品规格失败');
    }
    const amount = product.retail_price * goodNumber;
    let goodsSepcifitionValue = [];
    if (!think.isEmpty(product.goods_specification_ids)) {
      goodsSepcifitionValue = await this.model('goods_specification').where({
        goods_id: goodId,
        id: {'in': product.goods_specification_ids.split('_')}
      }).getField('value');
    }

    const goodInfo = await this.model('goods').where({id: goodId}).find();
    goodInfo.goods_specifition_name_value = goodsSepcifitionValue.join(';');
    goodInfo.retail_price = product.retail_price;

    // 获取可用的优惠券信息，功能还示实现
    const couponInfo = await this.model('user_coupon').where({user_id: think.userId, id: couponId, used_time: 0}).find();
    let couponPrice = 0.00;
    if (!think.isEmpty(couponInfo)) {
      couponPrice = await this.model('coupon').where({
        id: couponInfo.coupon_id
      }).getField('type_money', true);
    }

    // 计算订单的费用
    const goodsTotalPrice = amount.toFixed();
    let orderTotalPrice = amount.toFixed(2) + freightPrice; // 订单的总价
    orderTotalPrice = Number(orderTotalPrice).toFixed(2);
    const actualPrice = orderTotalPrice - couponPrice; // 减去其它支付的金额后，要实际支付的金额

    // 获取要购买的商品
    // const checkedGoodsList = await this.model('cart').where({ user_id: think.userId, session_id: 1, checked: 1 }).select();
    // if (think.isEmpty(checkedGoodsList)) {
    //   return this.fail('请选择商品');
    // }

    // 下单的顾客信息
    const currUser = await this.model('user').where({ id: think.userId }).find();

    // 统计商品总价及生成订单内容描述
    const orderDesc = goodInfo.name + ' ' + goodInfo.goods_specifition_name_value + ',数量:' + goodNumber;

    const currentTime = parseInt(this.getTime() / 1000);

    const orderInfo = {
      order_sn: this.model('order').generateOrderNumber(),
      user_id: think.userId,

      // 收货地址和运费
      consignee: checkedAddress.name,
      mobile: checkedAddress.mobile,
      province: checkedAddress.province_id,
      city: checkedAddress.city_id,
      district: checkedAddress.district_id,
      address: checkedAddress.address,
      freight_price: freightPrice,

      // 留言
      postscript: this.post('postscript'),

      // 使用的优惠券
      coupon_id: 0,
      coupon_price: couponPrice,

      add_time: currentTime,
      goods_price: goodsTotalPrice,
      order_price: orderTotalPrice,
      actual_price: actualPrice,
      platform_order: ''
    };

    // 提交订单信息到platform
    const submitData = {
      'orderInfo': orderInfo,
      'userInfo': currUser,
      'description': orderDesc,
      'orderSubject': think.config('appService.appName') + ':' + orderInfo.order_sn,
      'deliveryAddress': checkedAddress.province_name + ' ' + checkedAddress.city_name + ' ' +
      checkedAddress.district_name + ' ' + orderInfo.address + ' ' + orderInfo.consignee
    };

    // 组织订单数据提交到muses的APP服务，创建platform后台订单
    const openid = currUser.weixin_openid; // await this.model('user').where({ id: orderInfo.user_id }).getField('weixin_openid', true);
    if (think.isEmpty(openid)) {
      return this.fail('请先登入帐户');
    }
    const params = {
      appid: think.config('appService.appid'),
      openid: openid,
      orderno: orderInfo.order_sn
    };
    const clientSecret = think.config('appService.appKey');
    const timestamp = new Date().getTime();
    const sign = cryptoUtil.getSignature(params, timestamp, clientSecret);
    await axios.post(think.config('appService.host') + '/api/' + think.config('appService.version') +
        '/orders?' + qs.stringify(params), submitData, {headers: {'Muses-Timestamp': timestamp, 'Muses-Signature': sign}})
      .then(res => {
        think.logger.debug('result Json=' + JSON.stringify(res.data));
        const resJson = res.data;
        if (resJson.result === false) {
          return this.fail('创建订单失败');
        }
        orderInfo.platform_order = resJson.data.orderNo;
      });

    think.logger.info('orderInfo Json=' + JSON.stringify(orderInfo));
    // 开启事务，插入订单信息和订单商品
    const orderId = await this.model('order').add(orderInfo);
    orderInfo.id = orderId;
    if (!orderId) {
      return this.fail('订单提交失败');
    }

    // 统计商品总价
    const orderGoodsData = [];
    // for (const goodsItem of checkedGoodsList) {
    orderGoodsData.push({
      order_id: orderId,
      goods_id: goodInfo.id,
      goods_sn: goodInfo.goods_sn,
      product_id: product.id,
      goods_name: goodInfo.name,
      list_pic_url: goodInfo.list_pic_url,
      market_price: goodInfo.counter_price > 0 ? goodInfo.counter_price : goodInfo.retail_price,
      retail_price: goodInfo.retail_price,
      number: goodNumber,
      goods_specifition_name_value: goodInfo.goods_specifition_name_value,
      goods_specifition_ids: product.goods_specifition_ids
    });
    // }

    await this.model('order_goods').addMany(orderGoodsData);

    return this.success({ orderInfo: orderInfo });
  }

  /**
   * 查询物流信息
   * @returns {Promise.<void>}
   */
  async expressAction() {
    const orderId = this.get('orderId');
    if (think.isEmpty(orderId)) {
      return this.fail('订单不存在');
    }
    const latestExpressInfo = await this.model('order_express').getLatestOrderExpress(orderId);
    return this.success(latestExpressInfo);
  }
};
