define([
  'jquery',
  'underscore',
  'backbone'
], function($, _, Backbone){

  var Entry = Backbone.Model.extend({
    defaults: {
      types: []
      ,eggGroups: []
      ,color: null
    }

    ,updateEntry: function(form){
      var me = this;
      $.get('/api/species/' + this.get('speciesNumber'), {formIdentifier: form}, function(data){
        me.set(_.pick(data, 'types', 'eggGroups', 'color'), {silent: true});
        me.trigger('update', me);
      });
    }
  });

  return Entry;
});