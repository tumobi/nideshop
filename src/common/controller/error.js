'use strict';
/**
 * error controller
 */
export default class extends think.controller.base {
  /**
   * display error page
   * @param  {Number} status []
   * @return {Promise}        []
   */
  displayError(status){

    //hide error message on production env
    if(think.env === 'production'){
      this.http.error = null;
    }

    let errorConfig = this.config('error');
    let message = this.http.error && this.http.error.message || '';
    if(this.isJsonp()){
      return this.jsonp({
        [errorConfig.key]: status,
        [errorConfig.msg]: message
      })
    }else if(this.isAjax()){
      return this.fail(status, message);
    }

    let module = 'common';
    if(think.mode !== think.mode_module){
      module = this.config('default_module');
    }
    let file = `${module}/error/${status}.html`;
    let options = this.config('tpl');
    options = think.extend({}, options, {type: 'base', file_depr: '_'});
    this.fetch(file, {}, options).then(content => {
      content = content.replace('ERROR_MESSAGE', message);
      this.type(options.content_type);
      this.end(content);
    });
  }
  /**
   * Bad Request 
   * @return {Promise} []
   */
  _400Action(){
    return this.displayError(400);
  }
  /**
   * Forbidden 
   * @return {Promise} []
   */
  _403Action(){
    return this.displayError(403);
  }
  /**
   * Not Found 
   * @return {Promise}      []
   */
  _404Action(){
    return this.displayError(404);
  }
  /**
   * Internal Server Error
   * @return {Promise}      []
   */
  _500Action(){
    return this.displayError(500);
  }
  /**
   * Service Unavailable
   * @return {Promise}      []
   */
  _503Action(){
    return this.displayError(503);
  }
}