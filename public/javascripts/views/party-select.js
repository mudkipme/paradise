define([
  'jquery'
  ,'underscore'
  ,'marionette'
  ,'i18next'
  ,'views/pokemon'
  ,'text!templates/party-select.html'
], function($, _, Marionette, i18n, PokemonView, partySelectTemplate){

  var helpers = PokemonView.prototype.templateHelpers;

  var PartySelectView = Marionette.ItemView.extend({
    tagName: 'ul'
    ,className: 'party-select-view'

    ,template: _.template(partySelectTemplate)
    ,templateHelpers: {
      t: i18n.t
      ,spriteUrl: function(pokemon){
        return helpers.spriteUrl.apply({pokemon: pokemon});
      }
      ,pokemonName: function(pokemon){
        return helpers.pokemonName.apply({pokemon: pokemon});
      }
    }

    ,collectionEvents: {
      'add remove change sort': 'render'
    }
  });

  return PartySelectView;
});