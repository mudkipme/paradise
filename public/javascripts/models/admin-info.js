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
        ,contentType: 'application/json'
        ,data: JSON.stringify(params)
        ,processData: false
        ,success: function(data){
          me.trigger('giftedPokemon', data);
        }
      });
    }

    ,giftItem: function(params){
      var me = this;
      me.sync(null, me, {
        url: '/api/admin/event-item'
        ,type: 'POST'
        ,contentType: 'application/json'
        ,data: JSON.stringify(params)
        ,processData: false
        ,success: function(data){
          me.trigger('giftedItem', data);
        }
      });
    }

    ,sendMsg: function(params){
      var me = this;

      me.sync(null, me, {
        url: '/api/admin/send-msg'
        ,type: 'POST'
        ,contentType: 'application/json'
        ,data: JSON.stringify(params)
        ,processData: false
        ,success: function(data){
          me.trigger('sentMsg', data);
        }
      });
    }
  });

  return AdminInfo;
});