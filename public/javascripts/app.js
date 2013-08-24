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
  ,'moment/lang/zh-cn'
  ,'moment/lang/zh-tw'
  ,'util'
], function($, _, Backbone, Marionette, AppBase, i18n, moment,
  vent, Router, Controller, io, AlertView, ModalView, Trainer){

  var App = new AppBase();

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

  // Alert and Model support
  App.addInitializer(function(){
    // Display an alert
    vent.on('alert', function(options){
      App.alertRegion.show(new AlertView(options));
    });

    // Display an alert
    vent.on('modal', function(options){
      App.modalRegion.show(new ModalView(options));
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
  });

  // initialize trainer, router and controller
  App.addInitializer(function(){
    App.trainer = new Trainer(PARADISE.me);

    App.appRouter = new Router({
      controller: new Controller
    });
  });

  // initialize socket.io connection
  App.addInitializer(function(){
    io.start();
  });

  // After all initialize events
  App.on('initialize:after', function(){
    Backbone.history.start({pushState: true});
  });

  return App;
});