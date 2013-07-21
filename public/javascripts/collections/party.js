define([
  'jquery',
  'underscore',
  'backbone',
  'models/pokemon'
], function($, _, Backbone, Pokemon){

  var Party = Backbone.Collection.extend({
    model: Pokemon
  });
  return Party;
});