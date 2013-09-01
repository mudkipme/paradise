define([
  'jquery',
  'underscore',
  'backbone',
  'models/item'
], function($, _, Backbone, Item){

  var PokeMart = Backbone.Collection.extend({
    model: Item
    ,url: '/api/item'
  });

  return PokeMart;
});