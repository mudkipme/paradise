define([
  'jquery'
  ,'underscore'
  ,'marionette'
  ,'i18next'
  ,'text!templates/shelf.html'
  ,'util'
], function($, _, Marionette, i18n, shelfTemplate){

  var ShelfView = Marionette.ItemView.extend({
    className: 'shelf-view'

    ,template: _.template(shelfTemplate)
    ,templateHelpers: { t: i18n.t }

    ,events: {
      'click .shelf-item': 'showItem'
    }

    ,onRender: function(){
      this.setPosition();
      this.$el.css('opacity', 0).offset();
      this.$el.transition({'opacity': 1});
    }

    ,setPosition: function(){
      var shelves = this.options.pokeMart.ui.shelves;
      this.$el.height(shelves.height());
      this.$el.css('max-width', shelves.width());
    }

    ,showItem: function(e){
      e.stopPropagation();
    }
  });

  return ShelfView;
});