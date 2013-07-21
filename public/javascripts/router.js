define([
  'jquery'
  ,'underscore'
  ,'backbone'
  ,'views/home'
  ,'views/party'
], function($, _, Backbone, HomeView, PartyView){
  
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
      $('#paradise-app').prepend(view.render().el);
    },
    home: function(){
      this.homeView = this.homeView || new HomeView;
      this.switchView(this.homeView);
    },
    party: function(){
      this.partyView = this.partyView || new PartyView;
      this.switchView(this.partyView);
    }
  });

  return Router;
});