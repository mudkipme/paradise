define([
  'jquery',
  'underscore',
  'backbone',
  'models/pokemon'
], function($, _, Backbone, Pokemon){

  var Encounter = Backbone.Model.extend({
    url: '/api/encounter'

    ,defaults: {
      location: null
      ,area: null
      ,method: null
      ,pokemon: null
    }

    ,initialize: function(attributes, options){
      var me = this;
      me.pokemon = new Pokemon(this.get('pokemon'));
      me.trainer = options.trainer;

      me.on('change:pokemon', function(){
        me.pokemon.set(me.get('pokemon'));
      });
    }

    // Encounter a Pokemon
    ,goto: function(location){
      var me = this;
      me.sync(null, me, {
        type: 'POST'
        ,data: {location: location}
        ,processData: true
        ,success: function(data){
          me.set(data);
        }
      });
    }

    // Escape from encounter
    ,escape: function(){
      me.sync(null, me, {
        url: me.url + '/escape'
        ,type: 'POST'
        ,success: function(){
          me.clear();
          me.trigger('escape');
        }
      });
    }
  });

  return Encounter;
});