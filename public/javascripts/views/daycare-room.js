define([
  'jquery'
  ,'underscore'
  ,'marionette'
  ,'i18next'
  ,'vent'
  ,'models/daycare'
  ,'views/pokemon'
  ,'text!templates/daycare-room.html'
], function($, _, Marionette, i18n, vent, DayCare, PokemonView, dayCareRoomTemplate){

  var helpers = PokemonView.prototype.templateHelpers;

  var DayCareRoomView = Marionette.ItemView.extend({
    className: 'day-care-room'
    ,model: DayCare

    ,template: _.template(dayCareRoomTemplate)
    ,templateHelpers: {
      t: i18n.t
      ,Gender: helpers.Gender
      ,spriteUrl: function(pokemon){
        return helpers.spriteUrl.apply({pokemon: pokemon});
      }
      ,pokemonName: function(pokemon){
        return helpers.pokemonName.apply({pokemon: pokemon});
      }
    }

    ,events: {
      'click [data-pos]': 'withdraw'
    }

    ,modelEvents: {
      change: 'render'
      ,withdraw: 'refreshParty'
    }

    ,withdraw: function(e){
      var me = this;
      var pokemon = me.model[$(e.currentTarget).data('pos')];
      if (!pokemon) return;

      var pokemonName = helpers.pokemonName.apply({pokemon: pokemon.toJSON()});
      vent.trigger('modal', {
        title: i18n.t('day-care.withdraw')
        ,content: i18n.t('day-care.withdraw-confirm', {pokemon: pokemonName})
        ,type: 'confirm'
        ,btnType: 'warning'
        ,accept: function(){
          me.model.withdraw(pokemon);
        }
      });
    }

    ,refreshParty: function(e){
      vent.trigger('trainer:fetch');
    }
  });

  return DayCareRoomView;
});