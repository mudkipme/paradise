define([
  'jquery',
  'underscore',
  'backbone',
  'models/entry'
], function($, _, Backbone, Entry){

  var Pokedex = Backbone.Collection.extend({
    model: Entry

    ,initialize: function(models, options){
      this.trainer = options.trainer;
    }

    ,url: function(){
      return this.trainer.url() + '/pokedex';
    }
  });

  return Pokedex;
});