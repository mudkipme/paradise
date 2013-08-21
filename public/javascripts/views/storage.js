define([
  'jquery'
  ,'underscore'
  ,'marionette'
  ,'i18next'
  ,'collections/storage'
  ,'views/storage-pokemon'
  ,'text!templates/storage.html'
  ,'util'
], function($, _, Marionette, i18n, Storage, StoragePokemonView, storageTemplate){

  var StorageView = Marionette.CompositeView.extend({
    id: 'storage-view'
    ,collection: Storage

    ,itemView: StoragePokemonView
    ,itemViewContainer: '.pokemon-container'

    ,template: _.template(storageTemplate)
    ,templateHelpers: { t: i18n.t, wallpapers: Storage.wallpapers }

    ,serializeData: function(){
      return _.pick(this.collection, 'index', 'name', 'wallpaper');
    }

    ,appendHtml: function(cv, iv, index){
      var $container = this.getItemViewContainer(cv);
      $container.find('.pokemon-grid').eq(index).empty().append(iv.el);
    }

    ,onRender: function(){
      this.el.className = 'wallpaper-' + (this.collection.wallpaper || 'blue');
    }
  });

  return StorageView;
});