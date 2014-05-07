define([
  'jquery'
  ,'underscore'
  ,'marionette'
  ,'i18next'
  ,'vent'
  ,'models/daycare'
  ,'views/pokemon'
  ,'behaviors/party-popover'
  ,'text!templates/daycare-room.html'
], function($, _, Marionette, i18n, vent, DayCare, PokemonView, PartyPopover, dayCareRoomTemplate){

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
      ,canWithdraw: function(pokemon){
        return pokemon.trainer == require('app').trainer.id;
      }
    }

    ,behaviors: {
      PartyPopover: {
        behaviorClass: PartyPopover
        ,container: 'body'
      }
    }

    ,events: {
      'click .sprite:not(.empty)': 'withdraw'
      ,'selectPokemon .sprite.empty': 'deposit'
    }

    ,modelEvents: {
      change: 'render'
      ,withdraw: 'refreshParty'
    }

    ,onClose: function(){
      if (this.partyPopover) {
        this.partyPopover.close();
      }
    }

    ,withdraw: function(e){
      var me = this;
      var pokemon = me.model[$(e.currentTarget).data('pos')];
      if (!pokemon || pokemon.get('trainer') != require('app').trainer.id) return;

      var pokemonName = helpers.pokemonName.apply({pokemon: pokemon.toJSON()});
      vent.trigger('modal', {
        title: i18n.t('day-care.withdraw')
        ,content: i18n.t('day-care.withdraw-confirm', {pokemon: _.escape(pokemonName)})
        ,type: 'confirm'
        ,btnType: 'warning'
        ,accept: function(){
          me.model.withdraw(pokemon);
        }
      });
    }

    ,deposit: function(e, pokemon){
      this.model.deposit(pokemon);
    }

    ,refreshParty: function(e){
      vent.trigger('trainer:fetch');
    }
  });

  return DayCareRoomView;
});