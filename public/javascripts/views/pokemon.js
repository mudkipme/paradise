define([
  'jquery'
  ,'underscore'
  ,'marionette'
  ,'i18next'
  ,'models/pokemon'
  ,'text!templates/pokemon.html'
  ,'bootstrap/tooltip'
  ,'bootstrap/switch'
], function($, _, Marionette, i18n, Pokemon, pokemonTemplate){

  var Gender = { female: 1, male: 2, genderless: 3 };

  var PokemonView = Marionette.ItemView.extend({
    className: 'pokemon-view'
    ,model: Pokemon

    ,ui: {
      content: '.content'
    }

    ,events: {
      'click': 'toggle'
    }

    ,collapsed: true

    ,modelEvents: {

    }

    ,template: _.template(pokemonTemplate)

    ,templateHelpers: {
      t: i18n.t
      ,imgBase: PARADISE.imgBase
      ,Gender: Gender

      // Generate the sprite url of Pokémon
      ,spriteUrl: function(){
        var url = PARADISE.imgBase + '/pokemon/';
        var pokemon = this.pokemon;

        if (pokemon.isShiny) {
          url += 'shiny/';
        }
        if (pokemon.species.hasGenderDifferences && pokemon.gender == Gender.female) {
          url += 'female/';
        }
        url += pokemon.species.number;
        if (pokemon.formIdentifier) {
          url += '-' + pokemon.formIdentifier;
        }
        return url + '.png';
      }
    }

    // Wrap model data to avoid undefined error
    ,serializeData: function(){
      return {
        pokemon: this.model.toJSON()
      }
    }

    ,onRender: function(){
      this.$('.switch').bootstrapSwitch();
      this.$('[title]').tooltip();
    }

    ,collapse: function(){
      if (!this.collapsed) {
        this.trigger('before:collapse');
        this.ui.content.slideUp();
        this.collapsed = true;
      }
    }

    ,expand: function(){
      if (this.collapsed) {
        this.trigger('before:expand');
        this.ui.content.slideDown();
        this.collapsed = false;
      }
    }

    ,toggle: function(e){
      if ($(e.target).closest('.switch').size()
        || e.target.tagName.toUpperCase() == 'BUTTON'
        || e.target.tagName.toUpperCase() == 'A') {
        return;
      }
      if (this.collapsed) {
        this.expand();
      } else {
        this.collapse();
      }
    }
  });

  return PokemonView;
});