define([
  'marionette'
  ,'views/menu'
  ,'views/home'
  ,'views/party'
  ,'views/bag'
  ,'models/trainer'
], function(Marionette, MenuView, HomeView, PartyView, BagView, Trainer){

  // Avoid circular dependencies
  var App = null;

  return Marionette.Controller.extend({
    initialize: function(){
      App = require('app');

      App.menuRegion.show(new MenuView);
      this.trainer = new Trainer(PARADISE.me);
    }

    ,home: function(){
      var homeView = new HomeView({model: this.trainer});
      homeView.on('before:render', function(){
        App.mainRegion.expand();
      });
      homeView.on('close', function(){
        App.mainRegion.collapse();
      });
      App.mainRegion.show(homeView);
    }

    ,party: function(){
      App.mainRegion.show(new PartyView({collection: this.trainer.party}));
      this.trainer.fetch({reset: true});
    }

    ,bag: function(){
      App.mainRegion.show(new BagView({collection: this.trainer.pocket}));
      this.trainer.pocket.fetch();
    }
  });
});