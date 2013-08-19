define([
  'jquery',
  'underscore',
  'backbone'
], function($, _, Backbone){

  var Pokemon = Backbone.Model.extend({
    urlRoot: '/api/pokemon'

    ,deposit: function(){
      var me = this;
      me.sync(null, me, {
        url: me.url() + '/deposit'
        ,type: 'POST'
        ,success: function(){
          me.trigger('deposit', me);
        }
      });
    }

    ,release: function(){
      var me = this;
      me.sync(null, me, {
        url: me.url() + '/release'
        ,type: 'POST'
        ,success: function(){
          me.trigger('release', me);
        }
      });
    }

    ,sendPokemonCenter: function(){
      var me = this;
      me.sync(null, me, {
        url: me.url() + '/send-pokemon-center'
        ,type: 'POST'
        ,success: function(data){
          me.set(data);
        }
      });
    }

    ,holdItem: function(item){
      var me = this;
      me.sync(null, me, {
        url: me.url() + '/hold-item'
        ,type: 'POST'
        ,data: {itemId: item.get('item').id}
        ,processData: true
        ,success: function(data){
          me.set(data);
          item.trigger('hold', me);
          item.collection.fetch();
        }
      });
    }

    ,takeItem: function(){
      var me = this, item = me.get('holdItem');
      me.sync(null, me, {
        url: me.url() + '/take-item'
        ,type: 'POST'
        ,success: function(data){
          me.set(data);
          me.trigger('takeItem', item);
        }
      });
    }
  });
  return Pokemon;
});