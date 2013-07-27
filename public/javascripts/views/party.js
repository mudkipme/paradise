define([
  'jquery'
  ,'underscore'
  ,'backbone'
  ,'models/trainer'
  ,'views/pokemon'
  ,'text!templates/party.html'
], function($, _, Backbone, Trainer, PokemonView, partyTemplate){

  var PartyView = Backbone.View.extend({
    id: 'party-view'

    ,initialize: function(name){
      this.model = new Trainer({name: name || PARADISE.trainerName});
      this.listenTo(this.model, 'change', this.addAll);
    }

    ,render: function(){
      this.$el.html(_.template(partyTemplate, {}));
      this.addAll();
      this.model.fetch();
      return this;
    }

    ,addAll: function(){
      var me = this;

      this.model.party.each(function(pokemon){
        var view = new PokemonView({model: pokemon});
        me.$('.pokemon-list').append(view.render().el);
      });
    }
  });
  return PartyView;
});