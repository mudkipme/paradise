define([
  'marionette'
  ,'views/menu'
  ,'views/home'
  ,'views/party'
  ,'views/bag'
  ,'models/trainer'
], function(Marionette, MenuView, HomeView, PartyView, BagView, Trainer){
  return Marionette.Controller.extend({
    // Display menu view
    initialize: function(options){
      this.App = options.App;
      this.App.menuRegion.show(new MenuView);
      this.trainer = new Trainer({ name: PARADISE.trainerName });
    }

    ,home: function(){
      var App = this.App, homeView = new HomeView;
      homeView.on('before:render', function(){
        App.mainRegion.expand();
      });
      homeView.on('close', function(){
        App.mainRegion.collapse();
      });
      App.mainRegion.show(homeView);
    }

    ,party: function(){
      this.App.mainRegion.show(new PartyView({collection: this.trainer.party}));
      this.trainer.fetch();
    }

    ,bag: function(){
      this.App.mainRegion.show(new BagView({collection: this.trainer.pocket}));
      this.trainer.pocket.fetch();
    }
  });
});