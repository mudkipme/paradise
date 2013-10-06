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

    ,initialize: function(){
      this._lastForm = -1;
    }

    ,updateEntry: function(form){
      var me = this;
      if (this._lastForm == form) {
        return;
      }
      this._lastForm = form;
      $.get('/api/species/' + this.get('speciesNumber'), {formIdentifier: form}, function(data){
        me.set(_.pick(data, 'types', 'eggGroups', 'color'), {silent: true});
        me.trigger('update', me);
      });
    }
  });

  return Entry;
});