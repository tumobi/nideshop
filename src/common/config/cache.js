export default {
  type: 'file', //缓存类型
  timeout: 6 * 3600, //失效时间，单位：秒
  adapter: { //不同 adapter 下的配置
    file: {
      path: think.RUNTIME_PATH + '/cache', //缓存文件的根目录
      path_depth: 2, //缓存文件生成子目录的深度
      file_ext: '.json' //缓存文件的扩展名
    },
    redis: {
      prefix: 'nideshop_'
    },
    memcache: {
      prefix: 'nideshop_'
    }
  }
};