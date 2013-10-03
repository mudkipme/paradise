define([
  'jquery'
  ,'underscore'
  ,'backbone'
  ,'marionette'
  ,'i18next'
  ,'kinetic'
  ,'views/pokemon'
  ,'views/party-select'
  ,'views/pokemon-events'
  ,'text!templates/encounter.html'
  ,'util'
], function($, _, Backbone, Marionette, i18n, kinetic
 , PokemonView, PartySelectView, PokemonEventsView, encounterTemplate){

  var EncounterView = Marionette.Layout.extend({
    id: 'encounter-view'

    ,template: _.template(encounterTemplate)
    ,templateHelpers: PokemonView.prototype.templateHelpers

    ,regions: {
      partySelect: '.party-select'
    }

    ,ui: {
      pokemonEvents: '.pokemon-events'
      ,sprite: '.encounter-pokemon .sprite'
    }

    ,events: {
      'click .btn-escape': 'escape'
    }

    ,modelEvents: {
      'escape': 'escaped'
      ,'change:battleResult': 'render'
      ,'pokemon:events': 'showPokemonEvents'
    }

    ,initialize: function(){
      this.children = new Backbone.ChildViewContainer();
    }

    ,serializeData: function(){
      var data = this.model.toJSON();
      var time = new Date(this.model.trainer.localTime);
      data.timeOfDay = this.model.trainer.get('timeOfDay');
      if (data.timeOfDay == 'day' && time.getHours() >= 17) {
        data.timeOfDay = 'twilight';
      }
      if (this.model.battlePokemon) {
        data.battlePokemon = this.model.battlePokemon.toJSON();
        data.battlePokemonName = data.battlePokemon.nickname
          || i18n.t('pokemon:'+data.battlePokemon.species.name);
      }
      return data;
    }

    ,onRender: function(){
      var party = require('app').trainer.party;
      if (!this.model.get('battleResult') && !this.partySelectView) {
        this.partySelectView = new PartySelectView({collection: party});
        this.partySelect.show(this.partySelectView);
        this.partySelectView.on('choose', _.bind(this.battle, this));
      }
      if (this.model.get('battleResult') == 'win') {
        this.blurPokemon();
      }
    }

    ,onClose: function(){
      this.children.each(function(child){
        child.close();
        this.children.remove(child);
      }, this);
    }

    ,escape: function(){
      this.model.escape();
    }

    ,battle: function(pokemon){
      this.model.battle(pokemon);
    }

    ,escaped: function(){
      Backbone.history.navigate('/world', {trigger:true, replace: true});
    }

    ,showPokemonEvents: function(options){
      var view = new PokemonEventsView(options);
      this.children.add(view);
      view.render();
      this.ui.pokemonEvents.append(view.el);
    }

    // Will switch to CSS solution once Firefox support that
    ,blurPokemon: function(){
      var sp = this.ui.sprite;
      $.loadImage(sp.find('img').attr('src'))
      .done(function(img){
        var stage = new Kinetic.Stage({
          container: sp.get(0)
          ,width: 96
          ,height: 96
        });
        var layer = new Kinetic.Layer();
        var sprite = new Kinetic.Image({
          image: img
          ,width: 96
          ,height: 96
          ,filter: Kinetic.Filters.Blur
          ,filterRadius: 0
        });
        layer.add(sprite);
        stage.add(layer);
        new Kinetic.Tween({
          node: sprite
          ,filterRadius: 4
          ,duration: 0.5
        }).play();
      });
    }
  });

  return EncounterView;
});