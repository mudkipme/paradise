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

    ,collectionEvents: {
      'sync': 'renderPage'
    }

    ,template: _.template(msgListTemplate)

    ,onRender: function(){
      this.renderPage();
    }

    ,renderPage: function(){
      this.ui.pagination.pagination(this.collection.page, this.collection.totalPages());
    }
  });

  return MsgListView;
});