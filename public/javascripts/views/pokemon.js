define([
  'jquery'
  ,'underscore'
  ,'backbone'
  ,'i18next'
  ,'moment'
  ,'models/pokemon'
  ,'text!templates/pokemon.html'
  ,'bootstrap/tooltip'
  ,'bootstrap-switch'
], function($, _, Backbone, i18n, moment, Pokemon, pokemonTemplate){

  var Gender = { female: 1, male: 2, genderless: 3 };

  var PokemonView = Backbone.View.extend({
    className: 'pokemon-view'
    ,urlRoot: '/api/pokemon'
    ,model: Pokemon

    ,events: {
      'click': 'toggle'
    }

    ,render: function(){
      var data = {
        pokemon: this.model.toJSON()
        ,imgBase: PARADISE.imgBase
        ,spriteUrl: this.spriteUrl()
        ,Gender: Gender
      };

      this.$el.html(_.template(pokemonTemplate, data));
      this.$('.switch').bootstrapSwitch();
      this.$('[title]').tooltip();
      return this;
    }

    ,spriteUrl: function(){
      var url = PARADISE.imgBase + '/pokemon/';
      if (this.model.get('isShiny')) {
        url += 'shiny/';
      }
      if (this.model.get('species').hasGenderDifferences
        && this.model.get('gender') == Gender.female) {
        url += 'female/';
      }
      url += this.model.get('species').number;
      if (this.model.get('formIdentifier')) {
        url += '-' + this.model.get('formIdentifier');
      }
      url += '.png';
      return url;
    }

    ,toggle: function(e){
      if ($(e.target).closest('.switch').size()
        || e.target.tagName.toUpperCase() == 'BUTTON'
        || e.target.tagName.toUpperCase() == 'A') {
        return;
      }
      this.$('.content').slideToggle();
    }
  });
  return PokemonView;
});