define([
  'jquery'
  ,'underscore'
  ,'backbone'
  ,'models/msg'
], function($, _, Backbone, Msg){

  var Msgs = Backbone.Collection.extend({
    model: Msg
    ,pageSize: 10

    ,initialize: function(models, options){
      options = options || {};
      this.unread = options.unread || 0;
      this.total = options.total || 0;
      this.page = options.page || 1;
      this.type = options.type;
    }

    ,url: function(){
      return '/api/msg?'
        + $.param({ skip: (this.page - 1) * this.pageSize, limit: this.pageSize, type: this.type });
    }

    ,parse: function(resp){
      this.unread = resp.unread;
      this.total = resp.total;
      return resp.msgs;
    }

    ,getPage: function(page){
      this.page = page;
      this.fetch();
    }

    ,totalPages: function(){
      return Math.ceil(this.size() / this.pageSize);
    }
  });

  return Msgs;
});