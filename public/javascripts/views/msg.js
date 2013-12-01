define([
  'jquery'
  ,'underscore'
  ,'marionette'
  ,'i18next'
  ,'moment'
  ,'models/msg'
  ,'text!templates/msg.html'
  ,'util'
], function($, _, Marionette, i18n, moment, Msg, msgTemplate){

  var MsgView = Marionette.ItemView.extend({
    className: 'msg-view'
    ,tagName: 'li'
    ,model: Msg

    ,template: _.template(msgTemplate)
    ,templateHelpers: { t: i18n.t, moment: moment }

    ,events: {
      'click': 'read'
    }

    ,modelEvents: {
      'change': 'render'
    }

    ,ui: {
      'createTime': '.create-time'
    }

    ,onRender: function(){
      this.$el.toggleClass('unread', !this.model.get('read'));
      this.$el.toggleClass('need-accept', !!this.model.get('needAccept'));
      this.ui.createTime.tooltip({placement: 'left'});
    }

    ,read: function(){
      if (this.model.get('needAccept') || this.model.get('read')) return;
      this.model.read();
    }
  });

  return MsgView;
});