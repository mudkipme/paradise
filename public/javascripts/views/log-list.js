define([
  'jquery'
  ,'underscore'
  ,'marionette'
  ,'i18next'
  ,'views/log'
  ,'text!templates/log-list.html'
  ,'util'
], function($, _, Marionette, i18n, LogView, logListTemplate){

  var LogListView = Marionette.CompositeView.extend({
    id: 'log-list-view'

    ,itemView: LogView
    ,itemViewContainer: '.log-container'

    ,ui: {
      'pagination': '.pagination'
    }

    ,events: {
      'click .pagination a': 'switchPage'
    }

    ,collectionEvents: {
      'sync': 'renderPage'
    }

    ,template: _.template(logListTemplate)
    ,templateHelpers: { t: i18n.t }

    ,onRender: function(){
      this.renderPage();
    }

    ,renderPage: function(){
      this.ui.pagination.pagination(this.collection.page, this.collection.totalPages());
    }

    ,switchPage: function(e){
      e.preventDefault();
      var li = $(e.target).closest('li');
      if (li.hasClass('disabled') || li.hasClass('active')) {
        return;
      }
      this.collection.getPage(li.data('page'));
    }
  });

  return LogListView;
});