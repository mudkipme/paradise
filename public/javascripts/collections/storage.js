define([
  'jquery',
  'underscore',
  'backbone',
  'collections/party'
], function($, _, Backbone, Party){

  var Storage = Party.extend({
    boxId: 0
    ,name: ''
    ,wallpaper: 'blue'

    ,url: function(){
      return '/api/storage/' + this.boxId;
    }

    ,initialize: function(models, options){
      Party.prototype.initialize.apply(this, arguments);
      _.extend(this, _.pick(options || {}, 'boxId', 'name', 'wallpaper', 'trainer'));
    }

    ,parse: function(resp){
      _.extend(this, _.pick(resp, 'boxId', 'name', 'wallpaper'));
      return resp.pokemon;
    }

    // Remove extra party confusion
    ,resetOrder: function(){}
    ,set: function(){
      Backbone.Collection.prototype.set.apply(this, arguments);
    }

    ,sortPokemon: function(attribute){

    }
  });

  Storage.wallpapers = ['blue', 'pink', 'gray'];

  return Storage;
});