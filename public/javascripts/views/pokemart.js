define([
  'jquery'
  ,'underscore'
  ,'marionette'
  ,'i18next'
  ,'vent'
  ,'collections/pokemart'
  ,'views/shelf'
  ,'text!templates/pokemart.html'
  ,'util'
], function($, _, Marionette, i18n, vent, PokeMart, ShelfView, pokeMartTemplate){

  var PokeMartView = Marionette.Layout.extend({
    id: 'poke-mart-view'

    ,template: _.template(pokeMartTemplate)
    ,templateHelpers: { t: i18n.t }

    ,ui: {
      clerkEye: '.clerk .clerk-eye'
      ,shelves: '.shelves'
      ,bubble: '.bubble'
    }

    ,events: {
      'click .shelves li': 'openShelf'
      ,'click': 'closeShelf'
    }

    ,regions: {
      shelf: '.shelf-container'
    }

    ,onRender: function(){
      this.blinkEye();
    }

    ,blinkEye: function(){
      var me = this, index = 0;

      me.blink = setTimeout(function blink(){
        index = (index + 1) % 9;
        var id = 5 - Math.abs(index % 9 - 4);
        
        me.ui.clerkEye.prop('className', 'clerk-eye clerk-eye-' + id);
        me.blink = setTimeout(blink, (index == 0) ? 4000 : 70);
      }, 4000);
    }

    ,onBeforeClose: function(){
      clearTimeout(this.blink);
    }

    ,openShelf: function(e){
      e.stopPropagation();

      var pocket = $(e.currentTarget).data('pocket');
      if (this.collection.filterPocket(pocket).length == 0) {
        this.talk(i18n.t('action.pokemart-empty', {pocket: i18n.t('pocket.' + pocket)}), true);
        return;
      }
      this.hideTalk();
      this.shelf.show(new ShelfView({
        collection: this.collection
        ,pocket: pocket
        ,pokeMart: this
      }));
    }

    ,closeShelf: function(e){
      if ($(e.target).closest('.popover').size()) {
        return;
      }

      var shelf = this.shelf;
      if (shelf.currentView) {
        shelf.currentView.$el.transition({opacity: 0}, function(){
          shelf.close();
        });

        shelf.currentView.ui.shelfItems.each(function(i, item){
          var popover = $(item).data('bs.popover');
          popover && popover.leave(popover);
        });
      }
    }

    ,talk: function(text, force, type){
      // Use alert in small screens
      if (force && !this.ui.bubble.is(':visible')) {
        vent.trigger('alert', {
          type: type || 'warning'
          ,title: i18n.t('action.buy-item')
          ,content: text
        });
      }

      this.ui.bubble.text(text).transition({opacity: 1});
    }

    ,hideTalk: function(){
      this.ui.bubble.transition({opacity: 0});
    }
  });

  return PokeMartView;
});