define([
  'jquery'
  ,'underscore'
  ,'backbone'
  ,'marionette'
  ,'app-base'
  ,'i18next'
  ,'moment'
  ,'vent'
  ,'router'
  ,'controller'
  ,'io'
  ,'views/alert'
  ,'views/modal'
  ,'models/trainer'
  ,'models/admin-info'
  ,'collections/msgs'
  ,'collections/logs'
  ,'collections/pokemart'
  ,'moment/lang/zh-cn'
  ,'moment/lang/zh-tw'
  ,'util'
], function($, _, Backbone, Marionette, AppBase, i18n, moment, vent,
  Router, Controller, io, AlertView, ModalView, Trainer, AdminInfo, Msgs, Logs, PokeMart){

  var App = new AppBase;

  // Main region, expand & collapse for home view
  var MainRegion = Marionette.Region.extend({
    el: '#paradise-app > main'
    ,expand: function(){
      this.$el.addClass('expand');
    }
    ,collapse: function(){
      this.$el.removeClass('expand');
    }
    ,onShow: function(){
      this.$el.appear();
    }
  });

  var AlertRegion = Marionette.Region.extend({
    el: '#paradise-alert'
    ,initialize: function(){
      var me = this;
      me.ensureEl();
      me.$el.on('closed.bs.alert', function(){
        me.close();
      });
    }
    ,onShow: function(){
      this.$el.appear();
    }
  });

  var ModalRegion = Marionette.Region.extend({
    el: '#paradise-modal'
    ,initialize: function(){
      var me = this;
      me.ensureEl();
      me.$el.on('hidden.bs.modal', _.throttle(function(){
        me.close();
      }));
    }
    ,onShow: function(view){
      view.$el.modal('show');
    }
  });

  App.addRegions({
    menuRegion: '#paradise-app > aside'
    ,mainRegion: MainRegion
    ,alertRegion: AlertRegion
    ,modalRegion: ModalRegion
  });

  // initialize locales
  App.addAsyncInitializer(function(dfd){
    i18n.init({
      lng: PARADISE.locale
      ,fallbackLng: false
      ,load: 'current'
      ,lowerCaseLng: true
      ,resGetPath: '/locales/__lng__/__ns__.json'
      ,ns: {
        namespaces: ['app', 'pokemon', 'item', 'location']
        ,defaultNs: 'app'
      }
    }, function(){
      dfd.resolve();
    });

    var momentLngName = {'zh-hans': 'zh-cn', 'zh-hant': 'zh-tw'};
    moment.lang(momentLngName[PARADISE.locale] || PARADISE.locale);
  });

  // Alert, Model & Notification
  App.addInitializer(function(){
    // Display an alert
    vent.on('alert', function(options){
      App.alertRegion.show(new AlertView(options));
    });

    // Display an alert
    vent.on('modal', function(options){
      App.modalRegion.show(new ModalView(options));
    });

    vent.on('notification', function(msg){
      if (!('Notification' in window) || !msg) return;
      var noti = new Notification(i18n.t('msg.notification-title'), {
        icon: '/images/favicon.png'
        ,body: msg.content()
      });
      noti.onclick = function(){
        window.focus();
        Backbone.history.navigate('/msg', {trigger: true});
      };
    });
  });

  // Ajax Error Handler
  App.addInitializer(function(){
    $(document).ajaxError(function(e, xhr){
      var content = i18n.t('error.retry-please');
      try {
        content = i18n.t('error.' + JSON.parse(xhr.responseText).error);
      } catch(e) {}
      vent.trigger('alert', {
        type: xhr.status == 500 ? 'danger' : ''
        ,title: i18n.t('error.title')
        ,content: content
      });
    });

    $.ajaxSetup({ cache: false });
  });

  // initialize trainer, router and controller
  App.addInitializer(function(){
    App.trainer = new Trainer(PARADISE.me);
    App.msgs = new Msgs;
    App.logs = new Logs;
    App.pokeMart = new PokeMart;

    if (PARADISE.isAdmin) {
      App.adminInfo = new AdminInfo;
    }

    App.appRouter = new Router({
      controller: new Controller
    });

    App.msgs.on('sync unread', function(){
      vent.trigger('msg:update', App.msgs);
    });

    App.trainer.on('change:language', function(){
      location.reload();
    });

    vent.on('trainer:fetch', function(){
      App.trainer.fetch();
    });

    vent.on('logout', function(e){
      $.get('/bbs/logout', function(){
        if (e.jumpUrl) {
          location.href = e.jumpUrl;
        } else {
          location.reload();
        }
      });
    });
  });

  // initialize roadmap
  App.addInitializer(function(){
    vent.on('roadmap', function(feature, route){
      vent.trigger('modal', {
        title: i18n.t('roadmap.title')
        ,content: i18n.t('roadmap.' + feature)
        ,btnType: 'success'
        ,hidden: function(){
          if (route) {
            history.back();
          }
        }
      });
    });
  });

  // After all initialize events
  App.on('initialize:after', function(){
    Backbone.history.start({pushState: true});
  });

  return App;
});