define([
  'jquery'
  ,'underscore'
  ,'marionette'
  ,'i18next'
  ,'vent'
  ,'views/pokemon'
  ,'text!templates/party-select.html'
  ,'util'
], function($, _, Marionette, i18n, vent, PokemonView, partySelectTemplate){

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

    ,ui: {
      pokemon: '.pokemon'
    }

    ,events: {
      'click .pokemon': 'choosePokemon'
      ,'touchstart .pokemon': 'hoverPokemon'
    }

    ,collectionEvents: {
      'add remove change sort': 'render'
    }

    ,initialize: function(){
      this.listenTo(vent, 'windowResize', this.resetPosition);
    }

    ,onRender: function(){
      var me = this;
      _.defer(function(){
        me.resetPosition();
      });
    }

    ,resetPosition: function(){
      var pokemonNumber = this.collection.size();
      var width = this.$el.width(), singleWidth = this.ui.pokemon.width();
      var left = Math.ceil((singleWidth * pokemonNumber - width) / (pokemonNumber - 1));

      this.ui.pokemon.not(':first-child').css('margin-left', -left + 'px');
    }

    ,hoverPokemon: function(e){
      this.$('.hover').removeClass('hover');
      $(e.currentTarget).addClass('hover');
    }

    ,choosePokemon: function(e){
      this.trigger('choose', this.collection.get($(e.currentTarget).data('id')));
    }
  });

  return PartySelectView;
});