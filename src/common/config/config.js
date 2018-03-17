// default config
module.exports = {
  default_module: 'api',
  weixin: {
    appid: 'wxa42640aa1680b496', // 小程序 appid
    secret: '21709c72b7e4df91466d82b6a7216916', // 小程序密钥
    mch_id: '1319061501', // 商户帐号ID
    partner_key: 'musegogogomusegogogomusegogogo15', // 微信支付密钥
    notify_url: 'https://mini.91zmt.com/api/pay/notify' // 微信异步通知，例：https://www.nideshop.com/api/pay/notify
  },
  express: {
    // 快递物流信息查询使用的是快递鸟接口，申请地址：http://www.kdniao.com/
    appid: '1326549', // 对应快递鸟用户后台 用户ID
    appkey: '89ac3b19-819e-43eb-a1d3-5ff30b30e927', // 对应快递鸟用户后台 API key
    request_url: 'http://api.kdniao.cc/Ebusiness/EbusinessOrderHandle.aspx'
  },
  appService: {
    host: 'http://10.175.198.42:9694',
    version: 'v1',
    appid: 'wxmp_Ix32k5aI',
    appKey: 'g2pxpww3B4H4hhBf83CQuruQQqTsP4E2',
    appName: '甘坑小镇微商城'
  }
};
