define([
  'jquery'
  ,'underscore'
  ,'marionette'
  ,'i18next'
  ,'vent'
  ,'models/pokemon'
  ,'views/pokemon'
  ,'util'
], function($, _, Marionette, i18n, vent, Pokemon, PokemonView){

  var StoragePokemonView = Marionette.ItemView.extend({
    className: 'storage-pokemon-view'
    ,model: Pokemon

    ,template: _.template('<img class="sprite" src="<%= spriteUrl() %>" alt="<%- pokemonName() %>" draggable="false" />')
    ,templateHelpers: PokemonView.prototype.templateHelpers
    ,serializeData: PokemonView.prototype.serializeData

    ,events: {
      'shown.bs.popover': 'showPopover'
      ,'dragstart': 'bubbleDragEvent'
      ,'dragend': 'bubbleDragEvent'
    }

    ,ui: {
      sprite: '.sprite'
    }

    ,onRender: function(){
      var me = this;

      me.listenTo(vent, 'popover', me.hidePopover);
      me.$el.popover({
        html: true
        ,content: function(){
          if (!me.pokemonPopover) {
            me.pokemonPopover = new PokemonView({
              model: me.model
              ,collapsible: false
              ,collapsed: false
            });
            me.pokemonPopover.render();
          }
          return me.pokemonPopover.el;
        }
        ,placement: function(){
          var minWidth = 300;
          var left = me.$el.offset().left;
          if ($(document).width() < 768) {
            return 'bottom';
          } else if ($(document).width() - left - me.$el.width() > minWidth) {
            return 'right';
          } else {
            return 'left';
          }
        }
        ,container: me.storageView.el
      });

      me.$el.prop('draggable', true);
    }

    ,showPopover: function(e){
      if (this.pokemonPopover) {
        this.pokemonPopover.delegateEvents();
        this.pokemonPopover.$('[data-original-title]').tooltip();
      }
    }

    ,hidePopover: function(e){
      if (!e || e.target !== this.el) {
        var popover = this.$el.data('bs.popover');
        popover.leave(popover);
      }
    }

    ,onClose: function(){
      if (this.pokemonPopover) {
        this.pokemonPopover.close();
        this.$el.popover('destroy');
      }
    }

    ,bubbleDragEvent: function(e){
      this.trigger(e.type, e);
    }
  });

  return StoragePokemonView;
});