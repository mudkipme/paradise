define([
  'marionette'
  ,'views/menu'
  ,'views/home'
  ,'views/party'
], function(Marionette, MenuView, HomeView, PartyView){
  return Marionette.Controller.extend({
    // Display menu view
    initialize: function(options){
      this.menuRegion = options.menuRegion;
      this.mainRegion = options.mainRegion;

      this.menuRegion.show(new MenuView);
    }

    ,home: function(){
      var homeView = new HomeView, me = this;
      homeView.on('before:render', function(){
        me.mainRegion.expand();  
      });
      homeView.on('close', function(){
        me.mainRegion.collapse();  
      });
      me.mainRegion.show(homeView);
    }

    ,party: function(){
      this.mainRegion.show(new PartyView);
    }
  });
});