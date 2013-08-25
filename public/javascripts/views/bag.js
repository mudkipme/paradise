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
      ,'pagination': '.pagination'
    }

    ,events: {
      'click .pocket-select a': 'switchPocket'
      ,'click .pagination a': 'switchPage'
    }

    ,collectionEvents: {
      'refresh': 'renderPage'
    }

    ,template: _.template(bagTemplate)
    ,templateHelpers: { t: i18n.t }

    ,serializeData: function(){
      return {
        state: this.collection.state
      };
    }

    ,onRender: function(){
      if ($('html').hasClass('no-touch')) {
        this.ui.pocketSelect.tooltip({container: this.el});
      }
      this.renderPage();
    }

    ,appendHtml: function(cv, iv, index){
      var $container = this.getItemViewContainer(cv);
      $container.find('.item-grid').eq(index).empty().append(iv.el);
    }

    ,removeChildView: function(view){
      var grid = view.$el.parent();
      Marionette.CompositeView.prototype.removeChildView.call(this, view);
      $('<div/>').addClass('item-view item-view-empty').appendTo(grid);
      grid.appendTo(this.getItemViewContainer(this));
    }

    ,renderPage: function(){
      var state = this.collection.state;
      this.ui.pagination.pagination(state.currentPage, state.totalPages);
    }

    ,switchPage: function(e){
      e.preventDefault();
      var li = $(e.target).closest('li');
      if (li.hasClass('disabled') || li.hasClass('active')) {
        return;
      }
      this.collection.getPage(li.data('page'));
    }

    ,switchPocket: function(e){
      this.collection.switchPocket($(e.target).data('pocket'));
      this.ui.pocketSelect.removeClass('selected');
      $(e.target).addClass('selected');
    }
  });

  return BagView;
});
