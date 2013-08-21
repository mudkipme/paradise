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

    // Reset the order in party
    // Won't need in future Backbone release
    ,set: function(models, options){
      Backbone.Collection.prototype.set.apply(this, arguments);

      if (options && options.parse) models = this.parse(models, options);

      var ids = _.pluck(models, 'id');
      if (!_.isEqual(this.pluck('id'), ids)) {
        _.each(ids, function(id, index){
          this.get(id).order = index;
        }, this);
        this.sort();
      }
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
      this.trigger('move');
    }
  });
  return Party;
});