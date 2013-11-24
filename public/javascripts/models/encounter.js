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
      ,battleResult: null
      ,battlePokemon: null
      ,escape: false
    }

    ,initialize: function(attributes, options){
      var me = this;
      me.pokemon = new Pokemon(me.get('pokemon'));
      me.battlePokemon = options.trainer.party.get(me.get('battlePokemon'));
      if (me.get('battlePokemon') && !me.battlePokemon) {
        me.escape({silent: true});
      }
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

    // Begin battle
    ,battle: function(pokemon){
      var me = this;
      me.battlePokemon = pokemon;

      me.sync(null, me, {
        url: me.url + '/battle'
        ,type: 'POST'
        ,data: {pokemonId: pokemon.id}
        ,processData: true
        ,success: function(data){
          me.set({battleResult: data.result, escape: data.escape});
          _.each(data.events, function(ev){
            var pokemon = me.trainer.party.get(ev.pokemon.id);
            if (pokemon) {
              var oldPokemon = pokemon.toJSON();
              pokemon.set(ev.pokemon);
              me.trigger('pokemonEvents', {
                model: pokemon
                ,pokemonEvents: ev.events
                ,oldPokemon: oldPokemon
              });
            }
          });
          if (data.escape) {
            me.set(me.defaults, {silent: true});
          }
        }
      });
    }

    // Escape from encounter
    ,escape: function(options){
      var me = this;
      options = options || {};
      !options.silent && me.trigger('escape');

      me.sync(null, me, {
        url: me.url + '/escape'
        ,type: 'POST'
        ,success: function(){
          me.set(me.defaults, options);
        }
      });
    }

    ,catchPokemon: function(pokeBall){
      var me = this;
      me.pokeBall = pokeBall;
      me.sync(null, me, {
        url: me.url + '/catch'
        ,type: 'POST'
        ,data: {itemId: pokeBall.id}
        ,processData: true
        ,success: function(data){
          me.trigger('catch', data);
          if (data.escape || data.shake == 4) {
            me.set(me.defaults, {silent: true});
          }
        }
      });
    }
  });

  return Encounter;
});