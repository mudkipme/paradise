define([
  'jquery'
  ,'underscore'
  ,'marionette'
  ,'kinetic'
  ,'views/pokemon'
  ,'text!templates/pokemon-events.html'
], function($, _, Marionette, Kinetic, PokemonView, pokemonEventsTemplate){

  var PokemonEventsView = Marionette.ItemView.extend({
    className: 'pokemon-events-view'

    ,template: _.template(pokemonEventsTemplate)
    ,templateHelpers: PokemonView.prototype.templateHelpers

    ,ui: {
      ev: '.event'
      ,sprite: '.sprite-container'
    }

    ,serializeData: function(){
      return {
        pokemon: this.model.toJSON()
        ,events: this.pokemonEvents
        ,old: this.mixinTemplateHelpers({pokemon: this.oldPokemon})
      }
    }

    ,initialize: function(options){
      this.pokemonEvents = options.pokemonEvents;
      this.oldPokemon = options.oldPokemon;
    }

    ,onRender: function(){
      var me = this;
      this.ui.ev.hide().css({opacity: 0});
      _.defer(function(){
        me.ui.ev.each(function(i, ev){
          me.$el.queue(function(next){
            var pokemonEvent = me.pokemonEvents[$(ev).index()];
            if (pokemonEvent.type != 'evolution' && pokemonEvent.type != 'forme') {
              $(ev).show().transition({opacity: 1}, 500, next);
            } else {
              me.evolve(function(){
                $(ev).show().transition({opacity: 1}, 500, next);
              });
            }
          });
        });
      });
    }

    ,tweenChain: function(){
      var args = arguments;
      return function(){
        var dfds = _.map(args, function(options){
          var dfd = $.Deferred();
          new Kinetic.Tween(_.extend({
            onFinish: function(){
              dfd.resolve();
            }
            ,easing: Kinetic.Easings.EaseOut
            ,duration: 0.5
          }, options)).play();
          return dfd;
        });
        return $.when.apply($, dfds);
      };
    }

    ,evolve: function(callback){
      var me = this;
      var before = me.ui.sprite.data('before');
      var after = me.ui.sprite.data('after');

      var stage = new Kinetic.Stage({
        container: me.ui.sprite.get(0)
        ,width: 96
        ,height: 96
      });

      me.layer = new Kinetic.Layer();

      $.when($.loadImage(before), $.loadImage(after))
      .done(function(beforeImage, afterImage){
        before = new Kinetic.Image({
          x: 0
          ,y: 0
          ,image: beforeImage
          ,width: 96
          ,height: 96
          ,filter: Kinetic.Filters.Brighten
        });

        after = new Kinetic.Image({
          x: 48
          ,y: 48
          ,image: afterImage
          ,width: 96
          ,height: 96
          ,filter: Kinetic.Filters.Brighten
          ,filterBrightness: 255
          ,scaleX: 0
          ,scaleY: 0
        });

        me.layer.add(before);
        me.layer.add(after);
        stage.add(me.layer);
        
        var chain = me.tweenChain({
          node: before
          ,filterBrightness: 255
          ,duration: 1.5
        })();

        _.each(_.range(0.6, 0, -0.1), function(duration, i){
          var hideOpts = {
            duration: duration
            ,x: 48
            ,y: 48
            ,scaleX: 0
            ,scaleY: 0
          }, showOpts = {
            duration: duration
            ,x: 0
            ,y: 0
            ,scaleX: 1
            ,scaleY: 1
          };

          chain = chain.then(me.tweenChain(_.extend({
            node: before
          }, hideOpts), _.extend({
            node: after
          }, showOpts)));

          if (i != 5) {
            chain = chain.then(me.tweenChain(_.extend({
              node: before
            }, showOpts), _.extend({
              node: after
            }, hideOpts)));
          }
        });

        chain.then(me.tweenChain({
          node: after
          ,filterBrightness: 0
        })).then(callback);
      });
    }
  });

  return PokemonEventsView;
});