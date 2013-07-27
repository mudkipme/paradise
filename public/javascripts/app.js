define([
  'backbone'
  ,'marionette'
  ,'i18next'
  ,'moment'
  ,'moment-lang/zh-cn'
  ,'moment-lang/zh-tw'
  ,'bootstrap/transition'
  ,'bootstrap/collapse'
], function(Backbone, Marionette, i18n, moment){

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

  // load locales
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
      App.vent.trigger('locale:load');
    });

    var momentLngName = {'zh-hans': 'zh-cn', 'zh-hant': 'zh-tw'};
    moment.lang(momentLngName[options.locale] || options.locale);
    window.t = i18n.t;
  });

  return App;
});