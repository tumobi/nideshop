'use strict';

import Base from './base.js';
let moment = require('moment');

export default class extends Base {
    /**
     * index action
     * @return {Promise} []
     */
    indexAction() {
        //auto render template file index_index.html
        let order_sn = this.model('order').generateOrderNumber();
        return this.success(getTime());
        //return this.display();
    }

    /**
     * 获取订单列表
     * @return {Promise} []
     */
    async listAction() {

        let orderList = await this.model('order').where({user_id: think.userId}).page(1, 10).countSelect();

        let newOrderList = [];
        for (let item of orderList.data) {

            //订单的商品
            item.goodsList = await this.model('order_goods').where({order_id: item.id}).select();
            item.goodsCount = 0;
            item.goodsList.forEach(v => {
                item.goodsCount += v.number;
            });

            //订单状态的处理
            item.order_status_text = await this.model('order').getOrderStatusText(item.id);

            //可操作的选项
            item.handleOption = await this.model('order').getOrderHandleOption(item.id);

            newOrderList.push(item);

        }
        orderList.data = newOrderList;


        return this.success(orderList);
    }

    async detailAction() {
        let orderId = this.get('orderId');
        let orderInfo = await this.model('order').where({user_id: think.userId, id: orderId}).find();

        if (think.isEmpty(orderInfo)) {
            return this.fail('订单不存在');
        }

        orderInfo.province_name = await this.model('region').where({id: orderInfo.province}).getField('name', true);
        orderInfo.city_name = await this.model('region').where({id: orderInfo.city}).getField('name', true);
        orderInfo.district_name = await this.model('region').where({id: orderInfo.district}).getField('name', true);
        orderInfo.full_region = orderInfo.province_name + orderInfo.city_name + orderInfo.district_name;

        let orderGoods = await this.model('order_goods').where({order_id: orderId}).select();

        //订单状态的处理
        orderInfo.order_status_text = await this.model('order').getOrderStatusText(orderId);

        orderInfo.add_time = moment.unix(orderInfo.add_time).format("YYYY-MM-DD HH:mm:ss");
        orderInfo.final_pay_time = moment("001234", "Hmmss").format("mm:ss");
        //订单最后支付时间
        if (orderInfo.order_status === 0) {
            // if (moment().subtract(60, 'minutes') < moment(orderInfo.add_time)) {
                orderInfo.final_pay_time = moment("001234", "Hmmss").format("mm:ss")
            // } else {
            //     //超过时间不支付，更新订单状态为取消
            // }
        }

        //订单可操作的选择,删除，支付，收货，评论，退换货
        let handleOption = await this.model('order').getOrderHandleOption(orderId);

        return this.success({
            orderInfo: orderInfo,
            orderGoods: orderGoods,
            handleOption: handleOption
        });
    }

    /**
     * 提交订单
     * @returns {Promise.<void>}
     */
    async submitAction() {

        //获取收货地址信息和计算运费
        let addressId = this.post('addressId');
        let checkedAddress = await this.model('address').where({id: addressId}).find();
        if (think.isEmpty(checkedAddress)) {
            return this.fail('请选择收货地址');
        }
        let freightPrice = 0.00;

        //获取要购买的商品
        let checkedGoodsList = await this.model('cart').where({user_id: think.userId, session_id: 1, checked: 1}).select();
        if (think.isEmpty(checkedGoodsList)) {
            return this.fail('请选择商品');
        }

        //统计商品总价
        let goodsTotalPrice = 0.00;
        for (let cartItem of checkedGoodsList) {
            goodsTotalPrice += cartItem.number * cartItem.retail_price;
        }

        //获取订单使用的优惠券
        let couponId = this.post('couponId');
        let couponPrice = 0.00;
        if (!think.isEmpty(couponId)) {

        }

        //订单价格计算
        let orderTotalPrice = goodsTotalPrice + freightPrice - couponPrice;  //订单的总价
        let actualPrice = orderTotalPrice - 0.00;  //减去其它支付的金额后，要实际支付的金额


        let currentTime = parseInt(new Date().getTime() / 1000);

        let orderInfo = {

            order_sn: this.model('order').generateOrderNumber(),
            user_id: think.userId,

            //收货地址和运费
            consignee: checkedAddress.name,
            mobile: checkedAddress.mobile,
            province: checkedAddress.province_id,
            city: checkedAddress.city_id,
            district: checkedAddress.district_id,
            address: checkedAddress.address,
            freight_price: 0.00,

            //留言
            postscript: this.post('postscript'),

            //使用的优惠券
            coupon_id: 0,
            coupon_price: couponPrice,

            add_time: currentTime,
            goods_price: goodsTotalPrice,
            order_price: orderTotalPrice,
            actual_price: actualPrice

        };


        //开启事务，插入订单信息和订单商品
        let orderId = await this.model('order').add(orderInfo);
        orderInfo.id = orderId;
        if (!orderId) {
            return this.fail('订单提交失败');
        }

        //统计商品总价
        let orderGoodsData = [];
        for (let goodsItem of checkedGoodsList) {
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

        return this.success({orderInfo: orderInfo});
    }

}