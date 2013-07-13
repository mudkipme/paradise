define([
  'jquery'
  ,'underscore'
  ,'backbone'
  ,'i18next'
  ,'views/menu'
  ,'views/home'
  ,'views/party'
], function($, _, Backbone, i18n, MenuView, HomeView, PartyView){
  
  var Router = Backbone.Router.extend({
    routes: {
      '': 'home'
      ,'party': 'party'
    },
    switchView: function(view){
      if (this.currentView) {
        this.currentView.remove();
      }
      this.currentView = view;
      view.render();
      $('#paradise-app').prepend(view.el);
    },
    home: function(){
      this.homeView = this.homeView || new HomeView();
      this.switchView(this.homeView);
    },
    party: function(){
      this.partyView = this.partyView || new PartyView();
      this.switchView(this.partyView);
    }
  });

  

  var initialize = function(){
    var router = new Router;
    var menu = new MenuView;

    router.bind('route', function(route){
      menu.update(route);
    });

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
      $(function(){
        $('#paradise-app').append(menu.render().el);
        Backbone.history.start({pushState: true});
      });
    });
  };

  return {
    initialize: initialize
  };
});