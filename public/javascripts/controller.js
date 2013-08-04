define([
  'marionette'
  ,'views/menu'
  ,'views/home'
  ,'views/party'
  ,'models/trainer'
], function(Marionette, MenuView, HomeView, PartyView, Trainer){
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
      var trainer = new Trainer({name: PARADISE.trainerName});
      this.mainRegion.show(new PartyView({collection: trainer.party}));
      trainer.fetch();
    }
  });
});