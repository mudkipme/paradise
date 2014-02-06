define([
  'jquery'
  ,'underscore'
  ,'backbone'
], function($, _, Backbone){

  var Log = Backbone.Model.extend({
    urlRoot: '/api/log'

    ,defaults: {
      type: null
      ,trainer: null
      ,relatedTrainer: null
      ,createTime: null
      ,params: {}
    }
  });

  return Log;
});