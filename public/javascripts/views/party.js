define([
  'jquery'
  ,'underscore'
  ,'marionette'
  ,'models/trainer'
  ,'views/pokemon'
], function($, _, Marionette, Trainer, PokemonView){

  var PartyView = Marionette.CollectionView.extend({
    id: 'party-view'

    ,itemView: PokemonView

    ,initialize: function(name){
      this.trainer = new Trainer({name: name || PARADISE.trainerName});
      this.collection = this.trainer.party;
    }

    ,onRender: function(){
      this.trainer.fetch();
    }

    ,onItemviewBeforeExpand: function(itemView){
      this.children.each(function(child){
        child.collapse();
      });
    }
  });
  
  return PartyView;
});