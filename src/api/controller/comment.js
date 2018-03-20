const Base = require('./base.js');

module.exports = class extends Base {
  /**
   * 评论类型说明：
   * 0 商品
   * 1 专题
   */

  /**
   * 发表评论
   * @returns {Promise.<*|PreventPromise|void|Promise>}
   */
  async postAction() {
    const typeId = this.post('typeId');
    const valueId = this.post('valueId');
    const content = this.post('content');
    const buffer = Buffer.from(content);
    const insertId = await this.model('comment').add({
      type_id: typeId,
      value_id: valueId,
      content: buffer.toString('base64'),
      add_time: this.getTime(),
      user_id: this.getLoginUserId()
    });

    if (insertId) {
      return this.success('评论添加成功');
    } else {
      return this.fail('评论保存失败');
    }
  }

  async countAction() {
    const typeId = this.get('typeId');
    const valueId = this.get('valueId');

    const allCount = await this.model('comment').where({type_id: typeId, value_id: valueId}).count('id');

    const hasPicCount = await this.model('comment').alias('comment')
      .join({
        table: 'comment_picture',
        join: 'right',
        alias: 'comment_picture',
        on: ['id', 'comment_id']
      }).where({'comment.type_id': typeId, 'comment.value_id': valueId}).count('comment.id');

    return this.success({
      allCount: allCount,
      hasPicCount: hasPicCount
    });
  }

  async listAction() {
    const typeId = this.get('typeId');
    const valueId = this.get('valueId');
    const showType = this.get('showType'); // 选择评论的类型 0 全部， 1 只显示图片

    const page = this.get('page');
    const size = this.get('size');

    let comments = [];
    if (showType !== 1) {
      comments = await this.model('comment').where({
        type_id: typeId,
        value_id: valueId
      }).page(page, size).countSelect();
    } else {
      comments = await this.model('comment').alias('comment')
        .field(['comment.*'])
        .join({
          table: 'comment_picture',
          join: 'right',
          alias: 'comment_picture',
          on: ['id', 'comment_id']
        }).page(page, size).where({'comment.type_id': typeId, 'comment.value_id': valueId}).countSelect();
    }

    const commentList = [];
    for (const commentItem of comments.data) {
      const comment = {};
      comment.content = Buffer.from(commentItem.content, 'base64').toString();
      comment.type_id = commentItem.type_id;
      comment.value_id = commentItem.value_id;
      comment.id = commentItem.id;
      comment.add_time = think.datetime(new Date(commentItem.add_time * 1000));
      comment.user_info = await this.model('user').field(['username', 'avatar', 'nickname']).where({id: commentItem.user_id}).find();
      comment.pic_list = await this.model('comment_picture').where({comment_id: commentItem.id}).select();
      commentList.push(comment);
    }
    comments.data = commentList;
    return this.success(comments);
  }
};
