define([
  'backbone'
  ,'marionette'
  ,'i18next'
  ,'moment'
  ,'vent'
  ,'router'
  ,'controller'
  ,'moment-lang/zh-cn'
  ,'moment-lang/zh-tw'
  ,'bootstrap/transition'
  ,'bootstrap/collapse'
], function(Backbone, Marionette, i18n, moment, vent, Router, Controller){

  var App = new Marionette.Application();

  var MainRegion = Marionette.Region.extend({
    el: '#paradise-app > main'
    ,expand: function(){
      this.$el.removeClass('col-lg-9 col-sm-9 col-push-3');
    }
    ,collapse: function(){
      this.$el.addClass('col-lg-9 col-sm-9 col-push-3');
    }
  });

  App.addRegions({
    menuRegion: '#paradise-app > aside'
    ,mainRegion: MainRegion
  });

  // initialize locales
  App.addInitializer(function(options){
    i18n.init({
      lng: options.locale
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
    moment.lang(momentLngName[options.locale] || options.locale);
  });

  // initialize router and controller
  vent.on('app:initialize', function(){
    var controller = new Controller({
        menuRegion: App.menuRegion
        ,mainRegion: App.mainRegion
      });

    App.appRouter = new Router({
      controller: controller
    });
    vent.trigger('app:initialize:after');
  });

  // Use custom initialize:after because it's asynchronous
  vent.on('app:initialize:after', function(){
    Backbone.history.start({pushState: true});
  });

  return App;
});