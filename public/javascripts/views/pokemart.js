define([
  'jquery'
  ,'underscore'
  ,'marionette'
  ,'i18next'
  ,'collections/pokemart'
  ,'views/shelf'
  ,'text!templates/pokemart.html'
], function($, _, Marionette, i18n, PokeMart, ShelfView, pokeMartTemplate){

  var PokeMartView = Marionette.Layout.extend({
    id: 'poke-mart-view'

    ,template: _.template(pokeMartTemplate)
    ,templateHelpers: { t: i18n.t }

    ,ui: {
      clerkEye: '.clerk .clerk-eye'
      ,shelves: '.shelves'
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
      var shelf = this.collection.filter(function(item){
        return item.get('item').pocket == pocket;
      });
      if (shelf.length == 0) {
        this.talk(i18n.t('no-item', {pocket: i18n.t('action.pokemart-empty')}));
        return;
      }

      this.shelf.show(new ShelfView({
        collection: new PokeMart(shelf)
        ,pocket: pocket
        ,pokeMart: this
      }));
    }

    ,closeShelf: function(e){
      var shelf = this.shelf;
      if (shelf.currentView) {
        shelf.currentView.$el.transition({opacity: 0}).promise().done(function(){
          shelf.close();
        });
      }
    }

    ,talk: function(text){

    }
  });

  return PokeMartView;
});