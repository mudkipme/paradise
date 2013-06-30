define([
  'jquery',
  'underscore',
  'backbone',
  'views/home'
], function($, _, Backbone, HomeView){
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
    Backbone.history.start();
  };

  return {
    initialize: initialize
  };
});