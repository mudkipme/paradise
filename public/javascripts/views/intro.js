define([
  'jquery'
  ,'underscore'
  ,'backbone'
  ,'marionette'
  ,'i18next'
  ,'text!templates/intro.html'
  ,'util'
], function($, _, Backbone, Marionette, i18n, introTemplate){

  var regions = {
    kanto: [
      {speciesNumber: 1, name: 'bulbasaur'}
      ,{speciesNumber: 4, name: 'charmander'}
      ,{speciesNumber: 7, name: 'squirtle'}
    ]
    ,johto: [
      {speciesNumber: 152, name: 'chikorita'}
      ,{speciesNumber: 155, name: 'cyndaquil'}
      ,{speciesNumber: 158, name: 'totodile'}
    ]
    ,hoenn: [
      {speciesNumber: 252, name: 'treecko'}
      ,{speciesNumber: 255, name: 'torchic'}
      ,{speciesNumber: 258, name: 'mudkip'}
    ]
    ,sinnoh: [
      {speciesNumber: 387, name: 'turtwig'}
      ,{speciesNumber: 390, name: 'chimchar'}
      ,{speciesNumber: 393, name: 'piplup'}
    ]
    ,unova: [
      {speciesNumber: 495, name: 'snivy'}
      ,{speciesNumber: 498, name: 'tepig'}
      ,{speciesNumber: 501, name: 'oshawott'}
    ]
  };

  var IntroView = Marionette.ItemView.extend({
    id: 'intro-view'

    ,template: _.template(introTemplate)
    ,templateHelpers: { t: i18n.t }

    ,events: {
      'click .screen.next': 'nextScreen'
      ,'click .screen-region li': 'selectRegion'
      ,'click .screen-pokemon .pokemon': 'selectPokemon'
      ,'click .screen-final .pokemon': 'enterWorld'
    }

    ,ui: {
      pokemonSelect: '.pokemon-select .pokemon'
      ,introFinal: '.screen-final p'
      ,chozenPokemon: '.screen-final .pokemon'
    }

    ,nextScreen: function(e){
      var scr = $(e.currentTarget).closest('.screen');
      scr.transition({opacity: 0, y: -50}, function(){
        scr.addClass('hide');
        scr.next().removeClass('hide').css({opacity: 0, y: 50}).offset();
        scr.next().transition({opacity: 1, y: 0});
      });
    }

    ,selectRegion: function(e){
      var me = this;
      var region = $(e.currentTarget).data('region');

      _.each(regions[region], function(pokemon, i){
        me.ui.pokemonSelect.eq(i)
        .data('name', pokemon.name)
        .data('speciesNumber', pokemon.speciesNumber)
        .find('.inside').addClass('species-' + pokemon.speciesNumber);
      });
      this.nextScreen(e);
    }

    ,selectPokemon: function(e){
      var me = this;
      var speciesNumber = $(e.currentTarget).data('speciesNumber');
      var name = $(e.currentTarget).data('name');
      me.ui.introFinal.html(i18n.t('intro.final', {pokemon: i18n.t('pokemon:' + name)}));
      me.ui.chozenPokemon.find('.inside').addClass('species-' + speciesNumber);
      
      $.post('/api/trainer', {speciesNumber: speciesNumber}, function(){
        me.nextScreen(e);
      });
    }

    ,enterWorld: function(){
      this.$el.transition({opacity: 0}, 1500, function(){
        location.reload();
      });
    }
  });

  return IntroView;
});