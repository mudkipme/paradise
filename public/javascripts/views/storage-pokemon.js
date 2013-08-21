define([
  'jquery'
  ,'underscore'
  ,'marionette'
  ,'i18next'
  ,'vent'
  ,'models/pokemon'
  ,'views/pokemon'
  ,'util'
], function($, _, Marionette, i18n, vent, Pokemon, PokemonView){

  var StoragePokemonView = Marionette.ItemView.extend({
    className: 'storage-pokemon-view'
    ,model: Pokemon

    ,template: _.template('<img class="sprite" src="<%= spriteUrl() %>" alt="<%- pokemon.nickname || t(\'pokemon:\'+pokemon.species.name) %>" draggable="false" />')
    ,templateHelpers: PokemonView.prototype.templateHelpers
    ,serializeData: PokemonView.prototype.serializeData
  });

  return StoragePokemonView;
});