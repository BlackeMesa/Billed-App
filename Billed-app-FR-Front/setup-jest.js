import $ from 'jquery';
global.$ = global.jQuery = $;
module.exports = {
  // ...
  setupFiles: ["jest-fetch-mock"],  
};