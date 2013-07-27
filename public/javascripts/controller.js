define([
  'marionette'
  ,'app'
  ,'views/menu'
  ,'views/home'
  ,'views/party'
], function(Marionette, App, MenuView, HomeView, PartyView){
  return Marionette.Controller.extend({
    // Display menu view
    initialize: function(){
      var menu = new MenuView;
      App.menuRegion.show(menu);
      App.vent.bind('route', function(route){
        menu.update(route);
      });
    }

    ,home: function(){
      var homeView = new HomeView;
      homeView.on('render', function(){
        App.mainRegion.expand();  
      });
      homeView.on('close', function(){
        App.mainRegion.collapse();  
      });
      App.mainRegion.show(homeView);
    }

    ,party: function(){
      App.mainRegion.show(new PartyView);
    }
  });
});