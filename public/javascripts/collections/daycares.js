define([
  'jquery',
  'underscore',
  'backbone',
  'models/daycare'
], function($, _, Backbone, DayCare){

  var DayCares = Backbone.Collection.extend({
    model: DayCare

    ,initialize: function(models, options){
      this.trainer = options.trainer;
    }

    ,url: function(){
      var trainerName = _.isString(this.trainer) ? this.trainer : this.trainer.get('name');
      return '/api/daycare?trainer=' + trainerName;
    }
  });

  return DayCares;
});