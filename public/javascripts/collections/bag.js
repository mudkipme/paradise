define([
  'jquery',
  'underscore',
  'backbone',
  'models/item'
], function($, _, Backbone, Item){

  var Bag = Backbone.Collection.extend({
    model: Item

    ,initialize: function(models, options){
      this.trainer = options.trainer;
    }

    ,url: function(){
      return this.trainer.url() + '/bag';
    }
  });

  return Bag;
});