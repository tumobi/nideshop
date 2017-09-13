const Base = require('./base.js');

module.exports = class extends Base {
  /**
   * 获取购物车中的数据
   * @returns {Promise.<{cartList: *, cartTotal: {goodsCount: number, goodsAmount: number, checkedGoodsCount: number, checkedGoodsAmount: number}}>}
   */
  async getCart() {
    const cartList = await this.model('cart').where({user_id: think.userId, session_id: 1}).select();
    // 获取购物车统计信息
    let goodsCount = 0;
    let goodsAmount = 0.00;
    let checkedGoodsCount = 0;
    let checkedGoodsAmount = 0.00;
    for (const cartItem of cartList) {
      goodsCount += cartItem.number;
      goodsAmount += cartItem.number * cartItem.retail_price;
      if (!think.isEmpty(cartItem.checked)) {
        checkedGoodsCount += cartItem.number;
        checkedGoodsAmount += cartItem.number * cartItem.retail_price;
      }

      // 查找商品的图片
      cartItem.list_pic_url = await this.model('goods').where({id: cartItem.goods_id}).getField('list_pic_url', true);
    }

    return {
      cartList: cartList,
      cartTotal: {
        goodsCount: goodsCount,
        goodsAmount: goodsAmount,
        checkedGoodsCount: checkedGoodsCount,
        checkedGoodsAmount: checkedGoodsAmount
      }
    };
  }

  /**
   * 获取购物车信息，所有对购物车的增删改操作，都要重新返回购物车的信息
   * @return {Promise} []
   */
  async indexAction() {
    return this.success(await this.getCart());
  }

  /**
   * 添加商品到购物车
   * @returns {Promise.<*>}
   */
  async addAction() {
    const goodsId = this.post('goodsId');
    const productId = this.post('productId');
    const number = this.post('number');

    // 判断商品是否可以购买
    const goodsInfo = await this.model('goods').where({id: goodsId}).find();
    if (think.isEmpty(goodsInfo) || goodsInfo.is_delete === 1) {
      return this.fail(400, '商品已下架');
    }

    // 取得规格的信息,判断规格库存
    const productInfo = await this.model('product').where({goods_id: goodsId, id: productId}).find();
    if (think.isEmpty(productInfo) || productInfo.goods_number < number) {
      return this.fail(400, '库存不足');
    }

    // 判断购物车中是否存在此规格商品
    const cartInfo = await this.model('cart').where({goods_id: goodsId, product_id: productId}).find();
    if (think.isEmpty(cartInfo)) {
      // 添加操作

      // 添加规格名和值
      let goodsSepcifitionValue = [];
      if (!think.isEmpty(productInfo.goods_specification_ids)) {
        goodsSepcifitionValue = await this.model('goods_specification').where({
          goods_id: goodsId,
          id: {'in': productInfo.goods_specification_ids.split('_')}
        }).getField('value');
      }

      // 添加到购物车
      const cartData = {
        goods_id: goodsId,
        product_id: productId,
        goods_sn: productInfo.goods_sn,
        goods_name: goodsInfo.name,
        list_pic_url: goodsInfo.list_pic_url,
        number: number,
        session_id: 1,
        user_id: think.userId,
        retail_price: productInfo.retail_price,
        market_price: productInfo.retail_price,
        goods_specifition_name_value: goodsSepcifitionValue.join(';'),
        goods_specifition_ids: productInfo.goods_specification_ids,
        checked: 1
      };

      await this.model('cart').thenAdd(cartData, {product_id: productId});
    } else {
      // 如果已经存在购物车中，则数量增加
      if (productInfo.goods_number < (number + cartInfo.number)) {
        return this.fail(400, '库存不足');
      }

      await this.model('cart').where({
        goods_id: goodsId,
        product_id: productId,
        id: cartInfo.id
      }).increment('number', number);
    }
    return this.success(await this.getCart());
  }

  // 更新指定的购物车信息
  async updateAction() {
    const goodsId = this.post('goodsId');
    const productId = this.post('productId'); // 新的product_id
    const id = this.post('id'); // cart.id
    const number = parseInt(this.post('number')); // 不是

    // 取得规格的信息,判断规格库存
    const productInfo = await this.model('product').where({goods_id: goodsId, id: productId}).find();
    if (think.isEmpty(productInfo) || productInfo.goods_number < number) {
      return this.fail(400, '库存不足');
    }

    // 判断是否已经存在product_id购物车商品
    const cartInfo = await this.model('cart').where({id: id}).find();
    // 只是更新number
    if (cartInfo.product_id === productId) {
      await this.model('cart').where({id: id}).update({
        number: number
      });

      return this.success(await this.getCart());
    }

    const newCartInfo = await this.model('cart').where({goods_id: goodsId, product_id: productId}).find();
    if (think.isEmpty(newCartInfo)) {
      // 直接更新原来的cartInfo

      // 添加规格名和值
      let goodsSepcifition = [];
      if (!think.isEmpty(productInfo.goods_specification_ids)) {
        goodsSepcifition = await this.model('goods_specification').field(['nideshop_goods_specification.*', 'nideshop_specification.name']).join('nideshop_specification ON nideshop_specification.id=nideshop_goods_specification.specification_id').where({
          'nideshop_goods_specification.goods_id': goodsId,
          'nideshop_goods_specification.id': {'in': productInfo.goods_specification_ids.split('_')}
        }).select();
      }

      const cartData = {
        number: number,
        goods_specifition_name_value: JSON.stringify(goodsSepcifition),
        goods_specifition_ids: productInfo.goods_specification_ids,
        retail_price: productInfo.retail_price,
        market_price: productInfo.retail_price,
        product_id: productId,
        goods_sn: productInfo.goods_sn
      };

      await this.model('cart').where({id: id}).update(cartData);
    } else {
      // 合并购物车已有的product信息，删除已有的数据
      const newNumber = number + newCartInfo.number;

      if (think.isEmpty(productInfo) || productInfo.goods_number < newNumber) {
        return this.fail(400, '库存不足');
      }

      await this.model('cart').where({id: newCartInfo.id}).delete();

      const cartData = {
        number: newNumber,
        goods_specifition_name_value: newCartInfo.goods_specifition_name_value,
        goods_specifition_ids: newCartInfo.goods_specification_ids,
        retail_price: productInfo.retail_price,
        market_price: productInfo.retail_price,
        product_id: productId,
        goods_sn: productInfo.goods_sn
      };

      await this.model('cart').where({id: id}).update(cartData);
    }

    return this.success(await this.getCart());
  }

  // 是否选择商品，如果已经选择，则取消选择，批量操作
  async checkedAction() {
    let productId = this.post('productIds').toString();
    const isChecked = this.post('isChecked');

    if (think.isEmpty(productId)) {
      return this.fail('删除出错');
    }

    productId = productId.split(',');
    await this.model('cart').where({product_id: {'in': productId}}).update({checked: parseInt(isChecked)});

    return this.success(await this.getCart());
  }

  // 删除选中的购物车商品，批量删除
  async deleteAction() {
    let productId = this.post('productIds');
    if (!think.isString(productId)) {
      return this.fail('删除出错');
    }

    productId = productId.split(',');

    await this.model('cart').where({product_id: {'in': productId}}).delete();

    return this.success(await this.getCart());
  }

  // 获取购物车商品的总件件数
  async goodscountAction() {
    const cartData = await this.getCart();
    return this.success({
      cartTotal: {
        goodsCount: cartData.cartTotal.goodsCount
      }
    });
  }

  /**
   * 订单提交前的检验和填写相关订单信息
   * @returns {Promise.<void>}
   */
  async checkoutAction() {
    const addressId = this.get('addressId'); // 收货地址id
    // const couponId = this.get('couponId'); // 使用的优惠券id

    // 选择的收货地址
    let checkedAddress = null;
    if (addressId) {
      checkedAddress = await this.model('address').where({is_default: 1, user_id: think.userId}).find();
    } else {
      checkedAddress = await this.model('address').where({id: addressId, user_id: think.userId}).find();
    }

    if (!think.isEmpty(checkedAddress)) {
      checkedAddress.province_name = await this.model('region').getRegionName(checkedAddress.province_id);
      checkedAddress.city_name = await this.model('region').getRegionName(checkedAddress.city_id);
      checkedAddress.district_name = await this.model('region').getRegionName(checkedAddress.district_id);
      checkedAddress.full_region = checkedAddress.province_name + checkedAddress.city_name + checkedAddress.district_name;
    }

    // 根据收货地址计算运费
    const freightPrice = 0.00;

    // 获取要购买的商品
    const cartData = await this.getCart();
    const checkedGoodsList = cartData.cartList.filter(function(v) {
      return v.checked === 1;
    });

    // 获取可用的优惠券信息，功能还示实现
    const couponList = await this.model('user_coupon').select();
    const couponPrice = 0.00; // 使用优惠券减免的金额

    // 计算订单的费用
    const goodsTotalPrice = cartData.cartTotal.checkedGoodsAmount; // 商品总价
    const orderTotalPrice = cartData.cartTotal.checkedGoodsAmount + freightPrice - couponPrice; // 订单的总价
    const actualPrice = orderTotalPrice - 0.00; // 减去其它支付的金额后，要实际支付的金额

    return this.success({
      checkedAddress: checkedAddress,
      freightPrice: freightPrice,
      checkedCoupon: {},
      couponList: couponList,
      couponPrice: couponPrice,
      checkedGoodsList: checkedGoodsList,
      goodsTotalPrice: goodsTotalPrice,
      orderTotalPrice: orderTotalPrice,
      actualPrice: actualPrice
    });
  }
};
