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
        var beforeOptions = {
          x: 48
          ,y: 48
          ,image: beforeImage
          ,width: 96
          ,height: 96
          ,offsetX: 48
          ,offsetY: 48 
        }, afterOptions = _.defaults({
          image: afterImage
          ,brightness: 1
          ,scaleX: 0
          ,scaleY: 0
        }, beforeOptions);

        before = new Kinetic.Image(beforeOptions);
        after = new Kinetic.Image(afterOptions);

        me.layer.add(before);
        me.layer.add(after);
        stage.add(me.layer);

        before.cache();
        before.filters([Kinetic.Filters.Brighten]);
        after.cache();
        after.filters([Kinetic.Filters.Brighten]);
        
        me.ui.sprite.tweenChain({
          node: before
          ,brightness: 1
          ,duration: 1.5
        });

        _.each(_.range(0.6, 0, -0.1), function(duration, i){
          me.ui.sprite.tweenChain(
             { node: before, duration: duration, scaleX: 0, scaleY: 0 }
            ,{ node: after, duration: duration, scaleX: 1, scaleY: 1 }
          );

          if (i != 5) {
            me.ui.sprite.tweenChain(
               { node: after, duration: duration, scaleX: 0, scaleY: 0 }
              ,{ node: before, duration: duration, scaleX: 1, scaleY: 1 }
            );
          }
        });

        me.ui.sprite.tweenChain({
          node: after
          ,brightness: 0
        }).promise().done(callback);
      });
    }
  });

  return PokemonEventsView;
});