define([
  'jquery'
  ,'underscore'
  ,'marionette'
  ,'i18next'
  ,'models/daycare'
  ,'views/pokemon'
  ,'text!templates/daycare-room.html'
], function($, _, Marionette, i18n, DayCare, PokemonView, dayCareRoomTemplate){

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


  });

  return DayCareRoomView;
});