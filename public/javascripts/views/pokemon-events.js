define([
  'jquery'
  ,'underscore'
  ,'marionette'
  ,'views/pokemon'
  ,'text!templates/pokemon-events.html'
], function($, _, Marionette, PokemonView, pokemonEventsTemplate){

  var PokemonEventsView = Marionette.ItemView.extend({
    className: 'pokemon-events-view'

    ,template: _.template(pokemonEventsTemplate)
    ,templateHelpers: PokemonView.prototype.templateHelpers

    ,ui: {
      ev: '.event'
    }

    ,serializeData: function(){
      return {
        pokemon: this.model.toJSON()
        ,events: this.pokemonEvents
        ,old: this.mixinTemplateHelpers({pokemon: this.oldPokemon})
      }
    }

    ,initialize: function(options){
      this.pokemonEvents = options.pokemonEvents;
      this.oldPokemon = options.oldPokemon;
    }

    ,onRender: function(){
      this.ui.ev.hide().css({opacity: 0});
    }

    ,onShow: function(){
      var me = this;
      me.ui.ev.each(function(i, ev){
        me.$el.queue(function(next){
          var pokemonEvent = me.pokemonEvents[$(ev).index()];
          if (pokemonEvent.type != 'evolution') {
            $(ev).show().transition({opacity: 1}, 500, next);
          } else {

          }
        });
      });
    }
  });

  return PokemonEventsView;
});