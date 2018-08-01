const jwt = require('jsonwebtoken');
const secret = 'SLDLKKDS323ssdd@#@@gf';

module.exports = class extends think.Service {
  /**
   * 根据header中的X-Nideshop-Token值获取用户id
   */
  async getUserId(token) {
    if (!token) {
      return 0;
    }

    const result = await this.parse(token);
    if (think.isEmpty(result) || result.user_id <= 0) {
      return 0;
    }

    return result.user_id;
  }

  async create(userInfo) {
    const token = jwt.sign(userInfo, secret);
    return token;
  }

  async parse(token) {
    if (token) {
      try {
        return jwt.verify(token, secret);
      } catch (err) {
        return null;
      }
    }
    return null;
  }

  async verify(token) {
    const result = await this.parse(token);
    if (think.isEmpty(result)) {
      return false;
    }

    return true;
  }
};
