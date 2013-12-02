define([
  'jquery'
  ,'underscore'
  ,'marionette'
  ,'i18next'
  ,'views/msg'
  ,'text!templates/msg-list.html'
  ,'util'
], function($, _, Marionette, i18n, MsgView, msgListTemplate){

  var MsgListView = Marionette.CompositeView.extend({
    id: 'msg-list-view'

    ,itemView: MsgView
    ,itemViewContainer: '.msg-container'

    ,ui: {
      'pagination': '.pagination'
    }

    ,events: {
      'click .pagination a': 'switchPage'
    }

    ,collectionEvents: {
      'sync': 'renderPage'
    }

    ,template: _.template(msgListTemplate)
    ,templateHelpers: { t: i18n.t }

    ,onRender: function(){
      this.renderPage();
    }

    ,renderPage: function(){
      this.ui.pagination.pagination(this.collection.page, this.collection.totalPages());
    }

    ,switchPage: function(){
      e.preventDefault();
      var li = $(e.target).closest('li');
      if (li.hasClass('disabled') || li.hasClass('active')) {
        return;
      }
      this.collection.getPage(li.data('page'));
    }
  });

  return MsgListView;
});