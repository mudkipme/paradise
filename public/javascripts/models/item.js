define([
  'jquery'
  ,'underscore'
  ,'backbone'
], function($, _, Backbone){

  var Item = Backbone.Model.extend({
    url: function(){
      return '/api/item/' + this.get('item').id;
    }

    ,gift: function(trainer, number){
      var me = this;
      me.sync(null, me, {
        url: me.url() + '/gift'
        ,type: 'POST'
        ,data: {
          trainer: trainer
          ,number: number
        }
        ,processData: true
        ,success: function(data){
          me.trigger('gift', {trainer: trainer, number: number});
          if (!data.number) {
            me.collection.remove(me);
          } else {
            me.set(data);
          }
        }
      });
    }

    ,buy: function(number){
      var me = this;
      me.sync(null, me, {
        url: me.url() + '/buy'
        ,type: 'POST'
        ,data: { number: number }
        ,processData: true
        ,success: function(data){
          me.trigger('buy', me, number, data.discount);
          me.set(_.omit(data, 'discount'));
        }
      });
    }
  });

  return Item;
});