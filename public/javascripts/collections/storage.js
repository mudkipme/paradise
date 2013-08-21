define([
  'jquery',
  'underscore',
  'backbone',
  'collections/party'
], function($, _, Backbone, Party){

  var Storage = Party.extend({
    index: 0
    ,name: ''
    ,wallpaper: 'blue'

    ,url: function(){
      return '/api/storage/' + this.index;
    }

    ,initialize: function(models, options){
      Party.prototype.initialize.apply(this, arguments);
      _.extend(this, _.pick(options || {}, 'index', 'name', 'wallpaper', 'trainer'));
    }

    ,parse: function(resp){
      _.extend(this, _.pick(resp, 'index', 'name', 'wallpaper'));
      return resp.pokemon;
    }


    ,sortPokemon: function(attribute){

    }
  });

  Storage.wallpapers = ['blue', 'pink', 'gray'];

  return Storage;
});