define([
  'jquery'
  ,'underscore'
  ,'marionette'
  ,'i18next'
  ,'collections/storage'
  ,'views/storage-pokemon'
  ,'text!templates/storage.html'
  ,'vent'
  ,'util'
], function($, _, Marionette, i18n, Storage, StoragePokemonView, storageTemplate, vent){

  var StorageView = Marionette.CompositeView.extend({
    id: 'storage-view'
    ,collection: Storage

    ,itemView: StoragePokemonView
    ,itemViewContainer: '.pokemon-container'

    ,template: _.template(storageTemplate)
    ,templateHelpers: { t: i18n.t, wallpapers: Storage.wallpapers }

    ,serializeData: function(){
      return _.pick(this.collection, 'boxId', 'name', 'wallpaper');
    }

    ,appendHtml: function(cv, iv, index){
      var $container = this.getItemViewContainer(cv);
      $container.find('.pokemon-grid')
        .eq(iv.model.get('position'))
        .empty().append(iv.el);
    }

    ,removeItemView: function(item){
      var me = this, view = this.children.findByModel(item);
      view.hidePopover();
      view.ui.sprite.transition({opacity: 0}, function(){
        me.removeChildView(view);
        me.checkEmpty();
      });
    }

    ,removeChildView: function(view){
      var grid = view.$el.parent();
      Marionette.CompositeView.prototype.removeChildView.call(this, view);
      $('<div/>').addClass('storage-pokemon-view storage-pokemon-view-empty')
        .appendTo(grid);
    }

    ,buildItemView: function(){
      var iv = Marionette.CompositeView.prototype.buildItemView.apply(this, arguments);
      iv.storageView = this;
      return iv;
    }

    ,onRender: function(){
      this.el.className = 'wallpaper-' + (this.collection.wallpaper || 'blue');
      this.listenTo(vent, 'io:storage:add', this.pokemonAdded);
    }

    ,pokemonAdded: function(pokemon){
      pokemon = this.collection.get(pokemon.id);
      if (pokemon) {
        var el = this.children.findByModel(pokemon).ui.sprite;
        el.css({'opacity': 0}).offset();
        el.transition({'opacity': 1});
      }
    }
  });

  return StorageView;
});