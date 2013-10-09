define([
  'jquery',
  'underscore',
  'backbone'
], function($, _, Backbone){

  var DayCare = Backbone.Model.extend({
    urlRoot: '/api/daycare'

    ,defaults: {
      pokemonA: null
      ,pokemonB: null
      ,egg: null
      ,breedRate: null
    }
  });

  return DayCare;
});