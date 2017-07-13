'use strict';

import Base from './base.js';

export default class extends Base {
    /**
     * index action
     * @return {Promise} []
     */
    indexAction() {
        //auto render template file index_index.html
        return this.display();
    }

    async addAction() {
        return this.success('评论添加成功');
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
            comments = await this.model('comment').where({type_id: typeId, value_id: valueId}).page(page, size).countSelect();

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
            let addTime = new Date(commentItem.add_time);
            comment.content = new Buffer(commentItem.content, 'base64').toString();
            comment.type_id = commentItem.type_id;
            comment.value_id = commentItem.value_id;
            comment.id = commentItem.id;
            comment.add_time = addTime.getFullYear() + '-' + addTime.getMonth() + '-' + addTime.getDay() + ' ' + addTime.getHours() + ':' + addTime.getMinutes() + ':' + addTime.getSeconds();
            // comment.user_id = commentItem.user_id;
            comment.user_info = {
                username: '哈**哈',
                avatar: 'http://nos.netease.com/mail-online/df467c7b6ce60bf9491d361c10e5e797/mail180x180.jpg',
                level: 'V3'
            };
            comment.pic_list = await this.model('comment_picture').where({comment_id: commentItem.id}).select();
            commentList.push(comment);
        }
        comments.data = commentList;
        return this.success(comments);
    }
}