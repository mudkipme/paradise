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
      ,'click .pagination a:not(.disabled)': 'switchPage'
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
    }


    ,renderPage: function(){
      var pagination = this.ui.pagination.empty();
      var state = this.collection.state;
      if (state.totalPages == 0) return;

      var minPage = Math.max(state.currentPage - 2, 1);
      var maxPage = Math.min(minPage + 5, state.totalPages);

      _.each(_.range(minPage, maxPage + 1), function(page){
        $('<li><a href="#">' + page + '</a></li>')
        .toggleClass('active', page == state.currentPage)
        .data('page', page)
        .appendTo(pagination);
      });
      
      $('<li><a href="#">&laquo;</a></li>')
      .toggleClass('disabled', state.currentPage == 1)
      .data('page', state.currentPage - 1)
      .prependTo(pagination);

      $('<li><a href="#">&raquo;</a></li>')
      .toggleClass('disabled', state.currentPage == state.totalPages)
      .data('page', state.currentPage + 1)
      .appendTo(pagination);
    }

    ,switchPage: function(e){
      e.preventDefault();
      this.collection.getPage($(e.target).closest('li').data('page'));
    }

    ,switchPocket: function(e){
      this.collection.switchPocket($(e.target).data('pocket'));
      this.ui.pocketSelect.removeClass('selected');
      $(e.target).addClass('selected');
    }
  });

  return BagView;
});
