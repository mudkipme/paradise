define([
  'jquery'
  ,'underscore'
  ,'backbone'
  ,'collections/party'
  ,'collections/pocket'
  ,'collections/storage'
  ,'models/encounter'
  ,'collections/pokedex'
  ,'collections/daycares'
], function($, _, Backbone, Party, Pocket, Storage, Encounter, Pokedex, DayCares){

  var Trainer = Backbone.Model.extend({
    initialize: function(){
      this.party = new Party(this.get('party'), {trainer: this});
      this.pocket = new Pocket({trainer: this});
      this.storage = new Storage([], {trainer: this});
      this.encounter = new Encounter(this.get('encounter'), {trainer: this});
      this.pokedex = new Pokedex([], {trainer: this});
      this.dayCares = new DayCares([], {trainer: this});

      this.listenTo(this.party, 'move', this.moveParty);
    }

    ,url: function(){
      return '/api/trainer/' + this.get('name');
    }

    ,parse: function(resp){
      this.party.set(resp.party);
      this.encounter.set(resp.encounter);
      return resp;
    }

    ,moveParty: function(){
      var order = [];
      this.party.each(function(pokemon){
        order.push(pokemon.id);
      });
      this.sync(null, this, {
        url: this.url() + '/move'
        ,type: 'POST'
        ,data: {order: order}
        ,processData: true
      });
    }
  });

  return Trainer;
});