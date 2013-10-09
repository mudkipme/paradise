define([
  'jquery',
  'underscore',
  'backbone'
], function($, _, Backbone){

  var DayCare = Backbone.Model.extend({
    urlRoot: '/api/daycare'
  });

  return DayCare;
});