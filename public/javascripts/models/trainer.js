define([
  'jquery'
  ,'underscore'
  ,'backbone'
  ,'collections/party'
  ,'collections/pocket'
], function($, _, Backbone, Party, Pocket){

  var Trainer = Backbone.Model.extend({
    initialize: function(){
      this.party = new Party(this.get('party'));
      this.pocket = new Pocket({trainer: this});

      this.listenTo(this.party, 'moveParty', this.move);
    }

    ,url: function(){
      return '/api/trainer/' + this.get('name');
    }

    ,parse: function(response){
      this.party.set(response.party);
      return response;
    }

    ,moveParty: function(){
      var order = [];
      this.party.each(function(pokemon){
        order.push(pokemon.id);
      });
      this.party.trigger('reset');
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