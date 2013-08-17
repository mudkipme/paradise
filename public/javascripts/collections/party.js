define([
  'jquery',
  'underscore',
  'backbone',
  'models/pokemon'
], function($, _, Backbone, Pokemon){

  var Party = Backbone.Collection.extend({
    model: Pokemon

    ,constructor: function(){
      Backbone.Collection.apply(this, arguments);
      this.resetOrder();
    }

    ,initialize: function(){
      var me = this;

      this.on('deposit release', this.remove);
      this.on('add remove reset', this.resetOrder);
    }

    ,comparator: function(pokemon) {
      return pokemon.order;
    }

    ,resetOrder: function(){
      this.each(function(pokemon, index){
        pokemon.order = index;
      });
    }

    ,swap: function(src, dest){
      var index = src.order;
      src.order = dest.order;
      dest.order = index;

      this.sort();
    }
  });
  return Party;
});