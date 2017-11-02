### NideShop商城（服务端）

+ 界面高仿网易严选商城(主要是2016年wap版)
+ 测试数据采集自网易严选商城
+ 功能和数据库参考ecshop
+ 服务端api基于Ｎode.js+ThinkJS+MySQL
+ 计划添加基于Vue.js的后台管理系统、PC版、Ｗap版

本项目需要配合微信小程序端使用，GitHub: [https://github.com/tumobi/nideshop-mini-program](https://github.com/tumobi/nideshop-mini-program)


### 本地开发环境配置
+ 克隆项目到本地
```
git clone https://github.com/tumobi/nideshop
```
+ 创建数据库nideshop并导入项目根目录下的nideshop.sql
```
CREATE SCHEMA `nideshop` DEFAULT CHARACTER SET utf8mb4 ;
```
> 注意数据库字符编码为utf8mb4 
+ 更改数据库配置
  src/common/config/adapter.js
  
```
  /**
 * model adapter config
 * @type {Object}
 */
exports.model = {
  type: 'mysql',
  common: {
    logConnect: isDev,
    logSql: isDev,
    logger: msg => think.logger.info(msg)
  },
  mysql: {
    handle: mysql,
    database: 'nideshop',
    prefix: 'nideshop_',
    encoding: 'utf8mb4',
    host: '127.0.0.1',
    port: '3306',
    user: 'root',
    password: 'root',
    dateStrings: true
  }
};

  ```
+ 填写微信登录和微信支付配置
src/common/config/config.js
```
// default config
module.exports = {
  default_module: 'api',
  weixin: {
    appid: '', // 小程序 appid
    secret: '', // 小程序密钥
    mch_id: '', // 商户帐号ID
    partner_key: '', // 微信支付密钥
    notify_url: '' // 微信异步通知，例：https://www.nideshop.com/api/pay/notify
  }
};
```

+ 安装依赖并启动
```
npm install
npm start
```
访问http://127.0.0.1:8360/

### 线上部署

+ 没有域名部署参考文档：[不用买域名、不用备案、不用配置https快速部署Node.js微信小程序商城（基于Node.js+MySQL+ThinkJS）](http://www.jianshu.com/p/78a0f5f424e1)

+ 如有域名且已备案，可参考：
  + [阿里云 Ubuntu 16.04 下部署 Node.js + MySQL 微信小程序商城](http://www.jianshu.com/p/38d13a7c1b78)
  + [阿里云 CentOS 7.3 下部署基于 Node.js + MySQL 的微信小程序商城](http://www.jianshu.com/p/5d5497697b0a)


### 微信小程序客户端截图

![首页](http://upload-images.jianshu.io/upload_images/3985656-c543b937ac6e79bb.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/320)

![专题](http://upload-images.jianshu.io/upload_images/3985656-bd606aac3b5491c2.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/320)

![分类](http://upload-images.jianshu.io/upload_images/3985656-fa9565158376d439.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/320)

![商品列表](http://upload-images.jianshu.io/upload_images/3985656-788b7fd2c4a558d0.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/320)

![商品详情](http://upload-images.jianshu.io/upload_images/3985656-99a6e0a57778d85f.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/320)

![购物车](http://upload-images.jianshu.io/upload_images/3985656-60ff2307d81f6bb2.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/320)

![订单中心](http://upload-images.jianshu.io/upload_images/3985656-dff837e6b2ec87b3.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/320)


### 功能列表
+ 首页
+ 分类首页、分类商品、新品首发、人气推荐商品页面
+ 商品详情页面，包含加入购物车、收藏商品、商品评论功能
+ 搜索功能
+ 专题功能
+ 品牌功能
+ 完整的购物流程，商品的加入、编辑、删除、批量选择，收货地址的选择，下单支付
+ 会员中心（订单、收藏、足迹、收货地址、意见反馈）
....

### 最后
喜欢别忘了Star
本项目长期更新完善，欢迎Watch
交流QQ群：497145766
