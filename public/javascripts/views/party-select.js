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
      'mouseenter .pokemon': 'withdrawCard'
      ,'mouseleave .pokemon': 'depositCard'
      ,'click .pokemon': 'choosePokemon'
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

    ,withdrawCard: function(e){
      $(e.currentTarget).css('z-index', 1);
    }

    ,depositCard: function(e){
      $(e.currentTarget).css('z-index', '');
    }

    ,choosePokemon: function(e){
      this.trigger('choose', this.collection.get($(e.currentTarget).data('id')));
    }
  });

  return PartySelectView;
});