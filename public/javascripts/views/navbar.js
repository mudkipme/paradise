define([
  'jquery'
  ,'underscore'
  ,'backbone'
  ,'vent'
  ,'util'
], function($, _, Backbone, vent){

  var NavBarView = Backbone.View.extend({
    el: 'nav.navbar'

    ,events: {
      'click a.switch-language': 'switchLaguage'
      ,'click a.logout, a.re-login': 'logout'
      ,'click a[href]': 'navigate'
      ,'click a.username': 'notification'
    }

    ,initialize: function(){
      $(document).ajaxStart(_.bind(this.ajaxStart, this));
      $(document).ajaxStop(_.bind(this.ajaxStop, this));
      vent.on('msg:update', _.bind(this.msgUpdate, this));
    }

    ,ajaxStart: function(){
      this.$('.ajax-loading').addClass('visible').offset();
      this.$('.ajax-loading').transition({opacity: 1});
    }

    ,ajaxStop: function(){
      this.$('.ajax-loading').stop().transition({opacity: 0}, function(){
        $(this).removeClass('visible');
      });
    }

    ,switchLaguage: function(e){
      e.preventDefault();
      var language = $(e.target).data('language');
      var trainer = require('app').trainer;
      
      if (!trainer.isNew()) {
        trainer.save({language: language}, {patch: true, wait: true});
      } else {
        document.cookie = 'i18next=' + language;
        location.reload();
      }
    }

    ,logout: function(e){
      e.preventDefault();
      vent.trigger('logout', {
        jumpUrl: e.currentTarget.href
      });
    }

    ,navigate: function(e){
      if (e.target.host == location.host) {
        e.preventDefault();
        Backbone.history.navigate(e.target.pathname, {trigger: true});
      }
    }

    ,msgUpdate: function(msgs){
      this.$('.unread-number').text(msgs.unread)
      .toggleClass('hide', !msgs.unread);
    }

    ,notification: function(){
      if (!('Notification' in window) || navigator.userAgent.match(/360/)) return;
      if (Notification.permission == 'denied' || Notification.permission == 'granted')
        return;
      
      Notification.requestPermission(function(permission){
        if (!('permission' in Notification)) {
          Notification.permission = permission;
        }
      });
    }
  });
  
  return NavBarView;
});