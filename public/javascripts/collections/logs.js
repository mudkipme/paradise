define([
  'jquery'
  ,'underscore'
  ,'backbone'
  ,'models/log'
], function($, _, Backbone, Log){

  var Logs = Backbone.Collection.extend({
    model: Log
    ,pageSize: 10

    ,initialize: function(models, options){
      options = options || {};
      this.total = options.total || 0;
      this.page = options.page || 1;
      this.type = options.type;
    }

    ,url: function(){
      return '/api/log?'
        + $.param({ skip: (this.page - 1) * this.pageSize, limit: this.pageSize, type: this.type });
    }

    ,parse: function(resp){
      this.total = resp.total;
      return resp.logs;
    }

    ,getPage: function(page){
      this.page = page;
      this.fetch();
    }

    ,totalPages: function(){
      return Math.ceil(this.total / this.pageSize);
    }
  });

  return Logs;
});