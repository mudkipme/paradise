define([
  'jquery'
  ,'backbone'
  ,'marionette'
  ,'i18next'
  ,'moment'
  ,'vent'
  ,'router'
  ,'controller'
  ,'views/alert'
  ,'views/modal'
  ,'moment/lang/zh-cn'
  ,'moment/lang/zh-tw'
], function($, Backbone, Marionette, i18n, moment, vent,
  Router, Controller, AlertView, ModalView){

  var App = new Marionette.Application();

  // Main region, expand & collapse for home view
  var MainRegion = Marionette.Region.extend({
    el: '#paradise-app > main'
    ,expand: function(){
      this.$el.removeClass('col-lg-9 col-sm-9 col-push-3');
    }
    ,collapse: function(){
      this.$el.addClass('col-lg-9 col-sm-9 col-push-3');
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
      if ($(window).scrollTop() > this.$el.offset().top) {
        $(window).scrollTop(this.$el.offset().top);
      }
    }
  });

  var ModalRegion = Marionette.Region.extend({
    el: '#paradise-modal'
    ,initialize: function(){
      var me = this;
      me.ensureEl();
      me.$el.on('hidden.bs.modal', function(){
        setTimeout(function(){
          me.close();
        }, 0);
      });
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
  App.addInitializer(function(){
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
      vent.trigger('app:initialize');
    });

    var momentLngName = {'zh-hans': 'zh-cn', 'zh-hant': 'zh-tw'};
    moment.lang(momentLngName[PARADISE.locale] || PARADISE.locale);
  });

  // initialize router and controller
  // Use custom initialize event because it's asynchronous
  vent.on('app:initialize', function(){
    var controller = new Controller({
        menuRegion: App.menuRegion
        ,mainRegion: App.mainRegion
      });

    App.appRouter = new Router({
      controller: controller
    });
  });

  // After all initialize events
  vent.on('app:initialize', function(){
    Backbone.history.start({pushState: true});
  });

  // Display an alert
  vent.on('alert', function(options){
    App.alertRegion.show(new AlertView(options));
  });

  // Display an alert
  vent.on('modal', function(options){
    App.modalRegion.show(new ModalView(options));
  });

  // Ajax Error Handler
  $(document).ajaxError(function(e, xhr){
    var content = 'error.retry-please';
    try {
      content = 'error.' + JSON.parse(xhr.responseText).error;
    } catch(e) {}
    vent.trigger('alert', {
      type: xhr.status == 500 ? 'danger' : ''
      ,title: 'error.title'
      ,content: content
    });
  });

  return App;
});