define([
  'jquery',
  'underscore',
  'backbone'
], function($, _, Backbone){

  var Pokemon = Backbone.Model.extend({
    urlRoot: '/api/pokemon'
  });
  return Pokemon;
});