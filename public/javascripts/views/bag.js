define([
  'jquery'
  ,'underscore'
  ,'marionette'
  ,'i18next'
  ,'collections/pocket'
  ,'views/item'
  ,'text!templates/bag.html'
  ,'util'
], function($, _, Marionette, i18n, Pocket, ItemView, bagTemplate){

  var BagView = Marionette.CompositeView.extend({
    id: 'bag-view'
    ,collection: Pocket

    ,itemView: ItemView
    ,itemViewContainer: '.item-container'

    ,ui: {
      'pocketSelect': '.pocket-select a'
    }

    ,events: {
      'click .pocket-select a': 'switchPocket'
    }

    ,template: _.template(bagTemplate)
    ,templateHelpers: {
      t: i18n.t
    }

    ,serializeData: function(){
      return {
        state: this.collection.state
      };
    }

    ,onRender: function(){
      if ($('html').hasClass('no-touch')) {
        this.ui.pocketSelect.tooltip({container: this.el});
      }
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

    ,switchPocket: function(e){
      this.collection.switchPocket($(e.target).data('pocket'));
      this.ui.pocketSelect.removeClass('selected');
      $(e.target).addClass('selected');
    }
  });

  return BagView;
});
