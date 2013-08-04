define([
  'jquery',
  'underscore',
  'backbone',
  'models/pokemon'
], function($, _, Backbone, Pokemon){

  var Party = Backbone.Collection.extend({
    model: Pokemon

    ,initialize: function(){
      var me = this;

      this.on('deposit release', function(model){
        this.remove(model);
      });

      this.on('add', function(model){
        model.order = me.indexOf(model);
      });
    }

    ,comparator: function(model) {
      return model.order;
    }
  });
  return Party;
});