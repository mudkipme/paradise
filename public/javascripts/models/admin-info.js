define([
  'jquery'
  ,'underscore'
  ,'backbone'
], function($, _, Backbone){

  var AdminInfo = Backbone.Model.extend({
    url: '/api/admin/info'

    ,defaults: {
      onlineCount: 0
      ,trainerCount: 0
      ,pokemonCount: 0
      ,forms: []
      ,natures: []
      ,items: []
      ,pokeBalls: []
    }

    ,giftPokemon: function(params){
      var me = this;
      me.sync(null, me, {
        url: '/api/admin/event-pokemon'
        ,type: 'POST'
        ,data: params
        ,contentType: 'application/json'
        ,data: JSON.stringify(params)
        ,processData: false
        ,success: function(data){
          me.trigger('gifted', params);
        }
      });
    }
  });

  return AdminInfo;
});