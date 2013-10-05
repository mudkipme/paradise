define([
  'jquery',
  'underscore',
  'backbone'
], function($, _, Backbone){

  var Entry = Backbone.Model.extend({

    updateEntry: function(form){
      $.get('/api/species/' + this.get('speciesNumber'), {formIdentifier: form}, function(data){
      
      });
    }
  });

  return Entry;
});