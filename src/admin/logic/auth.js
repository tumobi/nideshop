module.exports = class extends think.Logic {
  loginAction() {
    this.allowMethods = 'post';
    this.rules = {
      username: { required: true, string: true },
      password: { required: true, string: true }
    };
  }
};
