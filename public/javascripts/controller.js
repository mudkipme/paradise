define([
  'marionette'
  ,'views/menu'
  ,'views/home'
  ,'views/party'
  ,'views/bag'
  ,'views/pokemart'
  ,'views/storage'
  ,'models/trainer'
], function(Marionette, MenuView, HomeView, PartyView, BagView, PokeMartView, StorageView, Trainer){

  // Avoid circular dependencies
  var App = null;

  return Marionette.Controller.extend({
    initialize: function(){
      App = require('app');

      App.menuRegion.show(new MenuView);
      App.trainer = new Trainer(PARADISE.me);
    }

    ,home: function(){
      var homeView = new HomeView({model: App.trainer});
      homeView.on('before:render', function(){
        App.mainRegion.expand();
      });
      homeView.on('close', function(){
        App.mainRegion.collapse();
      });
      App.mainRegion.show(homeView);
    }

    ,party: function(){
      App.mainRegion.show(new PartyView({collection: App.trainer.party}));
      App.trainer.fetch();
    }

    ,bag: function(){
      App.mainRegion.show(new BagView({collection: App.trainer.pocket}));
      App.trainer.pocket.fetch();
    }

    ,pokeMart: function(){
      App.mainRegion.show(new PokeMartView);
    }

    ,storage: function(){
      App.mainRegion.show(new StorageView({collection: App.trainer.storage}));
      App.trainer.storage.fetch();
    }
  });
});