define([
  'jquery'
  ,'underscore'
  ,'marionette'
  ,'i18next'
  ,'vent'
  ,'views/daycare-room'
  ,'behaviors/party-popover'
], function($, _, Marionette, i18n, vent, DayCareRoomView, PartyPopover){

  var OtherDayCareRoomView = DayCareRoomView.extend({
    className: 'day-care-room day-care-room-other'

    ,behaviors: {
      PartyPopover: {
        behaviorClass: PartyPopover
        ,container: '.day-care-carousel'
      }
    }

    ,withdraw: function(){}

    ,modelEvents: {
      requested: 'requested'
    }

    ,deposit: function(e, pokemon){
      this.model.request(pokemon);
    }

    ,requested: function(pokemon){
      var pokemonName = this.templateHelpers.pokemonName(pokemon.toJSON());
      vent.trigger('alert', {
        type: 'success'
        ,title: i18n.t('day-care.deposit')
        ,content: i18n.t('day-care.requested', {pokemon: _.escape(pokemonName), trainer: _.escape(this.model.collection.trainer)})
      });

      vent.trigger('modal:close');
    }
  });

  return OtherDayCareRoomView;
});