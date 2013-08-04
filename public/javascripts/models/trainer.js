define([
  'jquery'
  ,'underscore'
  ,'backbone'
  ,'collections/party'
], function($, _, Backbone, Party){

  var Trainer = Backbone.Model.extend({
    initialize: function(){
      this.party = new Party(this.get('party'));
      this.listenTo(this.party, 'move', this.move);
    }

    ,url: function(){
      return '/api/trainer/' + this.get('name');
    }

    ,parse: function(response){
      this.party.set(response.party);
      return response;
    }

    ,move: function(){
      var order = [], me = this;
      me.party.each(function(pokemon){
        order.push(pokemon.id);
      });
      me.party.trigger('reset');
      me.sync(null, me, {
        url: me.url() + '/move'
        ,type: 'POST'
        ,data: {order: order}
        ,processData: true
      });
    }
  });

  return Trainer;
});