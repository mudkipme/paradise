define([
  'jquery'
  ,'underscore'
  ,'backbone'
  ,'marionette'
  ,'i18next'
  ,'kinetic'
  ,'vent'
  ,'views/pokemon'
  ,'views/party-select'
  ,'views/pokemon-events'
  ,'views/bag-popover'
  ,'text!templates/encounter.html'
  ,'util'
], function($, _, Backbone, Marionette, i18n, kinetic, vent
 , PokemonView, PartySelectView, PokemonEventsView, BagPopoverView, encounterTemplate){

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
      ,pokeBall: '.btn-pokeball'
    }

    ,events: {
      'click .btn-escape': 'escape'
      ,'shown.bs.popover .btn-pokeball': 'showBagPopover'
      ,'selectItem .btn-pokeball': 'catchPokemon'
    }

    ,modelEvents: {
      'escape': 'escaped'
      ,'change:battleResult': 'render'
      ,'pokemonEvents': 'showPokemonEvents'
      ,'catch': 'showCatch'
    }

    ,initialize: function(){
      this.children = new Backbone.ChildViewContainer();
      this.listenTo(vent, 'popover', this.hidePopover);
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
      var me = this;
      var trainer = me.model.trainer;
      var party = trainer.party;

      // Show party Pokémon select
      if (!me.model.get('battleResult') && !me.partySelectView && me.model.get('pokemon')) {
        me.partySelectView = new PartySelectView({collection: party});
        me.partySelect.show(me.partySelectView);
        me.partySelectView.on('choose', _.bind(me.battle, me));
      }

      // Blur the wild Pokémon when win
      if (me.model.get('battleResult') == 'win') {
        me.blurPokemon();
      }

      // Select Poké Ball
      if (me.model.pokemon) {
        me.bagPopover = new BagPopoverView({
          collection: trainer.pocket.bag
          ,pocket: 'pokeballs'
          ,button: me.ui.pokeBall
        });
        me.ui.pokeBall.popover({
          html: true
          ,content: me.bagPopover.el
          ,placement: 'top'
        });
        me.bagPopover.on('render', function(){
          me.popoverRendering = true;
          me.ui.pokeBall.popover('show');
          me.popoverRendering = false;
        });
      }
    }

    ,onClose: function(){
      this.children.each(function(child){
        child.close();
        this.children.remove(child);
      }, this);

      if (this.bagPopover) {
        this.bagPopover.close();
      }
    }

    ,showBagPopover: function(){
      this.bagPopover.delegateEvents();
      if (!this.popoverRendering) {
        this.model.trainer.pocket.fetch();
      }
    }

    ,hidePopover: function(e){
      if (!e || e.target != this.ui.pokeBall.get(0)) {
        var popover = this.ui.pokeBall.data('bs.popover');
        popover && popover.leave(popover);
      }
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

    ,catchPokemon: function(e, item){
      this.model.catchPokemon(item);
      this.hidePopover();
    }

    ,showCatch: function(shake){
      var pokeBall = this.model.pokeBall;
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