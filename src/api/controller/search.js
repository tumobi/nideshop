'use strict';

import Base from './base.js';

export default class extends Base {
  /**
   * index action
   * @return {Promise} []
   */
  async indexAction() {
    //取出输入框默认的关键词
    let defaultKeyword = await this.model('keywords').where({ is_default: 1 }).limit(1).find();
    //取出热闹关键词
    let hotKeywordList = await this.model('keywords').distinct('keyword').field(['keyword', 'is_hot']).limit(10).select();

    let historyKeywordList = await this.model('search_history').distinct('keyword').where({ user_id: 1 }).limit(10).getField('keyword');

    return this.success({
      defaultKeyword: defaultKeyword,
      historyKeywordList: historyKeywordList,
      hotKeywordList: hotKeywordList
    });

  }

  async helperAction() {
    let keyword = this.get('keyword');
    let keywords = await this.model('keywords').distinct('keyword').where({ keyword: ['like', keyword + '%'] }).getField('keyword', 10);
    return this.success(keywords);
  }

  async clearhistoryAction() {
    let historyKeywordList = await this.model('search_history').where({ user_id: 1 }).delete();
    return this.success();
  }
}