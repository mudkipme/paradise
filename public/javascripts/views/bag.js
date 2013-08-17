define([
  'jquery'
  ,'underscore'
  ,'marionette'
  ,'i18next'
  ,'collections/pocket'
  ,'views/item'
  ,'text!templates/bag.html'
], function($, _, Marionette, i18n, Pocket, ItemView, bagTemplate){

  var BagView = Marionette.CompositeView.extend({
    id: 'bag-view'
    ,collection: Pocket

    ,itemView: ItemView
    ,itemViewContainer: '.item-container'

    ,template: _.template(bagTemplate)
    ,templateHelpers: {
      t: i18n.t
    }

    ,appendHtml: function(cv, iv, index){
      var $container = this.getItemViewContainer(cv);
      $container.find('.item-grid').eq(index).empty().append(iv.el);
    }

    ,removeChildView: function(view){
      var grid = view.$el.parent();
      Marionette.CompositeView.prototype.removeChildView.call(this, view);
      $('<div/>').addClass('item-view item-view-empty').appendTo(grid);
    }
  });

  return BagView;
});