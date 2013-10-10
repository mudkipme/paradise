define([
  'marionette'
  ,'vent'
  ,'views/menu'
  ,'views/home'
  ,'views/party'
  ,'views/bag'
  ,'views/pokemart'
  ,'views/storage'
  ,'views/world'
  ,'views/region'
  ,'views/encounter'
  ,'views/pokedex'
  ,'views/daycare'
], function(Marionette, vent, MenuView, HomeView, PartyView
  , BagView, PokeMartView, StorageView, WorldView, RegionView
  , EncounterView, PokedexView, DayCareView){

  // Avoid circular dependencies
  var App = null;

  return Marionette.Controller.extend({
    initialize: function(){
      App = require('app');
      App.menuRegion.show(new MenuView);
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
      App.mainRegion.show(new PokeMartView({collection: App.pokeMart}));
      App.pokeMart.fetch();
    }

    ,storage: function(){
      App.mainRegion.show(new StorageView({collection: App.trainer.storage}));
      App.trainer.storage.fetch({reset: true});
    }

    ,world: function(){
      App.mainRegion.show(new WorldView);
      App.trainer.fetch();
    }

    ,region: function(region){
      App.mainRegion.show(new RegionView({region: region}));
      App.trainer.fetch();
    }

    ,encounter: function(){
      App.mainRegion.show(new EncounterView({model: App.trainer.encounter}));
    }

    ,pokedex: function(){
      App.mainRegion.show(new PokedexView({collection: App.trainer.pokedex}));
      App.trainer.pokedex.fetch({reset: true});
    }

    ,daycare: function(){
      App.mainRegion.show(new DayCareView({collection: App.trainer.dayCares}));
      App.trainer.dayCares.fetch();
      App.trainer.fetch();
    }
  });
});