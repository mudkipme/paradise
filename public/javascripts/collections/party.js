define([
  'jquery'
  ,'underscore'
  ,'backbone'
  ,'models/pokemon'
], function($, _, Backbone, Pokemon){

  var Party = Backbone.Collection.extend({
    model: Pokemon

    ,constructor: function(){
      Backbone.Collection.apply(this, arguments);
      this.resetOrder();
    }

    ,initialize: function(){
      var me = this;

      this.on('deposit release withdraw', this.remove);
      this.on('add remove reset', this.resetOrder);
      _.bindAll(this, 'orderChange', 'modelSet');
    }

    // Reset the order in party
    // Won't need in future Backbone release
    ,set: function(models, options){
      Backbone.Collection.prototype.set.apply(this, arguments);
      if (!_.isArray(models)) return;
      if (this.size() != models.length) return;

      var me = this, setIds = _.pluck(models, 'id');

      if (!_.isEqual(me.pluck('id'), setIds)) {
        _.each(setIds, function(id, index){
          var pokemon = me.get(id);
          pokemon && pokemon.set({position: index}, {silent: true});
        });
        me.sort();
      }
    }

    ,comparator: function(pokemon){
      return pokemon.get('position');
    }

    ,resetOrder: function(){
      this.each(function(pokemon, index){
        pokemon.set({position: index}, {silent: true});
      });
    }

    ,swap: function(src, dest){
      var index = src.get('position');
      src.set({position: dest.get('position')}, {silent: true});
      dest.set({position: index}, {silent: true});

      this.sort();
      this.trigger('move');
    }

    ,orderChange: function(order){
      _.each(order, function(id, index){
        if (this.get(id)) {
          this.get(id).set({position: index}, {silent: true});
        }
      }, this);
      this.sort();
    }

    ,modelSet: function(model){
      var pokemon = this.get(model.id);
      pokemon && pokemon.set(model);
    }
  });
  return Party;
});