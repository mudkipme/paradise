define([
  'jquery',
  'underscore',
  'backbone',
  'i18next',
  'views/home'
], function($, _, Backbone, i18n, HomeView){
  var Router = Backbone.Router.extend({
    routes: {
      "": "home"
    },
    home: function(){
      var view = new HomeView();
      view.render();
    }
  });

  var initialize = function(){
    var router = new Router;
    i18n.init({
      lng: Paradise.locale,
      fallbackLng: false,
      load: 'current',
      lowerCaseLng: true,
      ns: {
        namespaces: ['app', 'pokemon'],
        defaultNs: 'app'
      }
    }, function(){
      Backbone.history.start();
    });
  };

  return {
    initialize: initialize
  };
});