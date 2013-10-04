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
], function($, _, Backbone, Marionette, i18n, Kinetic, vent
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

    ,showCatch: function(e){
      var me = this, pokeBall = me.model.pokeBall;
      var pokeBallImg = PARADISE.imgBase + '/encounter-pokeballs/'
        + pokeBall.get('item').name + '.png';
      $.when(me.pokemonCanvas(), $.loadImage(pokeBallImg))
      .done(function(sprite, pokeBallImg){
        sprite.setFilter(Kinetic.Filters.Brighten);
        if (me._pokeBall) {
          me._pokeBall.destroy();
        }
        var pokeBall = new Kinetic.Image({
          image: pokeBallImg
          ,width: 22
          ,height: 22
          ,x: 48
          ,y: 64
          ,scaleX: 0
          ,scaleY: 0
          ,offsetX: 11
          ,offsetY: 11
          ,filter: Kinetic.Filters.Brighten
        });
        me.layer.add(pokeBall);

        // Show the Poké Ball
        me.ui.sprite
        .tweenChain({ node: sprite, filterBrightness: 255 })
        .tweenChain({ node: sprite, scaleX: 0, scaleY: 0 }
          ,{ node: pokeBall, scaleX: 1, scaleY: 1 });

        // Shake the Poké Ball
        _.times(Math.min(e.shake, 3), function(time){
          me.ui.sprite.delay(500)
          .tweenChain({ node: pokeBall, rotationDeg: -45, x: 40 })
          .tweenChain({ node: pokeBall, rotationDeg: 45, x: 56 })
          .tweenChain({ node: pokeBall, rotationDeg: 0, x: 48 })
        });

        if (e.shake == 4) {
          // Capture Done!
          me.ui.sprite.delay(500)
          .tweenChain({ node: pokeBall, filterBrightness: 64 });
          me.showCatchSuccess();
        } else {
          // Capture Failed
          me.ui.sprite.delay(500)
          .tweenChain({ node: sprite, scaleX: 1, scaleY: 1, filterBrightness: 0 }
            ,{ node: pokeBall, scaleX: 0, scaleY: 0 });
        }

        me._pokeBall = pokeBall;
      });
    }

    // Successfully caught a Pokémon
    ,showCatchSuccess: function(){

    }

    // Convert Pokémon to Kinetic Objects
    ,pokemonCanvas: function(){
      if (this._pokemonCanvas) return this._pokemonCanvas;

      var dfd = $.Deferred(), me = this;
      $.loadImage(me.ui.sprite.find('img').attr('src'))
      .done(function(img){
        var stage = new Kinetic.Stage({
          container: me.ui.sprite.get(0)
          ,width: 96
          ,height: 96
        });

        me.layer = new Kinetic.Layer();
        var sprite = new Kinetic.Image({
          image: img
          ,x: 48
          ,y: 64
          ,width: 96
          ,height: 96
          ,offsetX: 48
          ,offsetY: 64
        });

        me.layer.add(sprite);
        stage.add(me.layer);
        dfd.resolve(sprite);
      });

      me._pokemonCanvas = dfd;
      return dfd;
    }

    // Will switch to CSS solution once Firefox support that
    ,blurPokemon: function(){
      var me = this;
      me.pokemonCanvas().done(function(sprite){
        sprite.setFilter(Kinetic.Filters.Blur);
        sprite.setFilterRadius(3);
        me.layer.batchDraw();
      });
    }
  });

  return EncounterView;
});