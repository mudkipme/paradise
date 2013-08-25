define([
  'jquery',
  'underscore',
  'backbone',
  'collections/party'
], function($, _, Backbone, Party){

  var Storage = Party.extend({
    name: ''
    ,wallpaper: 'blue'

    ,url: function(){
      return '/api/storage/' + this.boxId;
    }

    ,initialize: function(models, options){
      Party.prototype.initialize.apply(this, arguments);
      _.extend(this, _.pick(options || {}, 'name', 'wallpaper', 'trainer'));
      this.listenTo(this.trainer, 'change:currentBox', this.setCurrentBox);
      this.setCurrentBox();
    }

    ,parse: function(resp){
      _.extend(this, _.pick(resp, 'boxId', 'name', 'wallpaper'));
      return resp.pokemon;
    }

    ,save: function(options){
      _.extend(this, _.pick(options || {}, 'name', 'wallpaper'));
      this.sync('update', this, {
        attrs: _.pick(this, 'name', 'wallpaper')
      });
      this.trigger('sync');
    }

    ,resetOrder: function(){}
    ,set: function(){
      Backbone.Collection.prototype.set.apply(this, arguments);
    }

    ,setCurrentBox: function(){
      this.boxId = this.trainer.get('currentBox');
    }

    ,changeBox: function(boxId){
      this.trainer.save({currentBox: boxId}, {patch: true});
      this.fetch({reset: true});
    }

    ,move: function(pokemon, options){
      var me = this;

      me.sync(null, me, {
        url: '/api/storage/move'
        ,type: 'POST'
        ,data: _.extend({pokemon: pokemon.get('id')}, options)
        ,processData: true
        ,success: function(){
          me.moveSet(pokemon, options);
        }
      });
    }

    // Change client storage data
    ,moveSet: function(pokemon, options){
      if (options.boxId == this.boxId) {
        pokemon = this.get(pokemon);
        var dst = this.findWhere({position: options.position});
        if (dst && this.get(pokemon)) {
          dst.set({position: pokemon.get('position')}, {silent: true});
        } else if (dst) {
          this.remove(dst);
        }
        this.add(pokemon);
        pokemon.set({position: options.position}, {silent: true});
      } else {
        this.remove(pokemon);
      }
      this.trigger('move');
    }
  });

  Storage.wallpapers = ['blue', 'pink', 'gray'];

  return Storage;
});