define([
  'jquery'
  ,'underscore'
  ,'backbone'
  ,'collections/party'
], function($, _, Backbone, Party){

  var Trainer = Backbone.Model.extend({
    initialize: function(){
      this.party = new Party(this.get('party'));
    }

    ,url: function(){
      return '/api/trainer/' + this.get('name');
    }

    ,parse: function(response){
      this.party.set(response.party);
      return response;
    }
  });

  return Trainer;
});