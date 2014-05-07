define([
  'jquery'
  ,'underscore'
  ,'backbone'
  ,'models/pokemon'
], function($, _, Backbone, Pokemon){

  var DayCare = Backbone.Model.extend({
    urlRoot: '/api/daycare'

    ,defaults: {
      pokemonA: null
      ,pokemonB: null
      ,egg: null
      ,breedRate: null
    }

    ,initialize: function(){
      var me = this;
      _.each(['pokemonA', 'pokemonB', 'egg'], function(pos){
        me.on('change:' + pos, function(){
          me[pos] = me.get(pos) && new Pokemon(me.get(pos));
        });
        _.defer(me.trigger.bind(me, 'change:' + pos));
      });
    }

    ,reset: function(attrs){
      this.set(_.defaults({}, attrs, this.defaults));
    }

    ,deposit: function(pokemon){
      var me = this;
      me.sync(null, me, {
        url: me.url() + '/deposit'
        ,type: 'POST'
        ,data: {pokemonId: pokemon.get('id')}
        ,processData: true
        ,success: function(data){
          pokemon.trigger('deposit', pokemon);
          me.reset(data);
        }
      });
    }

    ,withdraw: function(pokemon){
      var me = this;
      me.sync(null, me, {
        url: me.url() + '/withdraw'
        ,type: 'POST'
        ,data: {pokemonId: pokemon.get('id')}
        ,processData: true
        ,success: function(data){
          me.trigger('withdraw', pokemon);
          data ? me.reset(data) : me.collection.remove(me);
        }
      });
    }

    ,request: function(pokemon){
      var me = this;
      me.sync(null, me, {
        url: me.url() + '/request'
        ,type: 'POST'
        ,data: {pokemonId: pokemon.get('id')}
        ,processData: true
        ,success: function(data){
          me.trigger('requested', pokemon);
        }
      });
    }
  });

  return DayCare;
});