'use strict';
/**
 * model
 */
export default class extends think.model.base {
    async getChildCategoryId(parentId){
        return await this.where({parent_id: parentId}).getField('id', 10000);
    }

    async getCategoryWhereIn(categoryId){
        let childIds = await this.getChildCategoryId(categoryId);
        childIds.push(categoryId);
        return childIds;
    }
}