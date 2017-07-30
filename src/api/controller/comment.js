'use strict';

import Base from './base.js';

export default class extends Base {

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

        let typeId = this.post('typeId');
        let valueId = this.post('valueId');
        let content = this.post('content');
        let buffer = new Buffer(content);
        let insertId  = await this.model('comment').add({
            type_id: typeId,
            value_id: valueId,
            content: buffer.toString('base64'),
            add_time: getTime(),
            user_id: getLoginUserId()
        });

        if (insertId ) {
            return this.success('评论添加成功');
        } else {
            return this.fail('评论保存失败');
        }
    }

    async countAction() {

        let typeId = this.get('typeId');
        let valueId = this.get('valueId');

        let allCount = await this.model('comment').where({type_id: typeId, value_id: valueId}).count('id');

        let hasPicCount = await this.model('comment').alias('comment')
            .join({
                table: 'comment_picture',
                join: 'right', //join 方式，有 left, right, inner 3 种方式
                alias: 'comment_picture',
                on: ['id', 'comment_id'] //ON 条件
            }).where({'comment.type_id': typeId, 'comment.value_id': valueId}).count('comment.id');


        return this.success({
            allCount: allCount,
            hasPicCount: hasPicCount
        });
    }

    async listAction() {

        let typeId = this.get('typeId');
        let valueId = this.get('valueId');
        let showType = this.get('showType'); //选择评论的类型 0 全部， 1 只显示图片

        let page = this.get('page');
        let size = this.get('size');

        let comments = [];

        if (showType != 1) {
            comments = await this.model('comment').where({
                type_id: typeId,
                value_id: valueId
            }).page(page, size).countSelect();

        } else {
            comments = await this.model('comment').alias('comment')
                .field(['comment.*'])
                .join({
                    table: 'comment_picture',
                    join: 'right', //join 方式，有 left, right, inner 3 种方式
                    alias: 'comment_picture',
                    on: ['id', 'comment_id'] //ON 条件
                }).page(page, size).where({'comment.type_id': typeId, 'comment.value_id': valueId}).countSelect();
        }


        let commentList = [];
        for (let commentItem of comments.data) {
            let comment = {};
            comment.content = new Buffer(commentItem.content, 'base64').toString();
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
}