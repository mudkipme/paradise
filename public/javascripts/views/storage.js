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

    ,ui: {
      name: '.name span'
      ,nameInput: '.name input'
      ,switchWallpaperText: '.btn-switch-wallpaper span:first-child'
      ,switchWallpaper: '.switch-wallpaper'
      ,pagination: '.pagination'
      ,grid: '.pokemon-grid'
    }

    ,events: {
      'click .switch-wallpaper a': 'switchWallpaper'
      ,'click .sort-storage a': 'sortStorage'
      ,'click .pagination a': 'switchPage'
      ,'click .name span': 'setNameBegin'
      ,'blur .name input': 'setNameEnd'
      ,'dragenter .storage-pokemon-view': 'dragenter'
      ,'dragover .storage-pokemon-view': 'dragover'
      ,'drop .storage-pokemon-view': 'drop'
    }

    ,collectionEvents: {
      'sync': 'storageChange'
      ,'move': 'sortPokemon'
    }

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
      $.when(view.$el.transition({'border-color': 'rgba(255, 255, 255, 0.3)'}).promise()
        ,view.ui.sprite.transition({opacity: 0}).promise())
      .done(function(){
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
      this.listenTo(this.collection.trainer, 'change:storageNum', this.renderPage);
      this.renderPage();
    }

    ,pokemonAdded: function(pokemon){
      pokemon = this.collection.get(pokemon.id);
      if (pokemon) {
        var view = this.children.findByModel(pokemon);
        view.$el.css({'border-color': 'rgba(255, 255, 255, 0.3)'}).offset();
        view.$el.transition({'border-color': '#fff'});
        view.ui.sprite.css({opacity: 0}).offset();
        view.ui.sprite.transition({opacity: 1});
      }
    }

    ,storageChange: function(){
      var wallpaper = this.collection.wallpaper || 'blue';
      this.el.className = 'wallpaper-' + wallpaper;
      this.ui.switchWallpaperText.text(i18n.t('wallpaper.' + wallpaper));
      this.ui.switchWallpaper.children().removeClass('active');
      this.ui.switchWallpaper
        .find('[data-wallpaper="' + wallpaper + '"]')
        .parent().addClass('active');

      var dn = i18n.t('stat.storage-name', {boxId: this.collection.boxId + 1});
      this.ui.name.show().text(this.collection.name || dn);
      this.ui.nameInput.val(this.collection.name).prop('placeholder', dn).hide();
      this.renderPage();
    }

    ,renderPage: function(){
      var totalPages = this.collection.trainer.get('storageNum');
      var currentPage = this.collection.boxId + 1;

      this.ui.pagination.pagination(currentPage, totalPages);
    }

    ,switchWallpaper: function(e){
      e.preventDefault();
      this.collection.save({wallpaper: $(e.target).data('wallpaper')});
    }

    ,sortPokemon: function(e){
      e.preventDefault();
    }

    ,switchPage: function(e){
      e.preventDefault();
      var li = $(e.target).closest('li');
      if (li.hasClass('disabled') || li.hasClass('active')) {
        return;
      }
      this.collection.changeBox(li.data('page') - 1);
    }

    ,setNameBegin: function(e){
      this.ui.name.hide();
      this.ui.nameInput.show().focus();
    }

    ,setNameEnd: function(e){
      var name = this.ui.nameInput.val().substr(0, 12);
      this.collection.save({name: name});
    }

    ,onItemviewDragstart: function(view, e){
      this.dragSource = view;
      view.$el.addClass('dragging');
      e.originalEvent.dataTransfer.effectAllowed = 'move';
      e.originalEvent.dataTransfer.setData('Text', view.model.get('id'));
    }

    ,dragenter: function(e){
      this.$('.storage-pokemon-view').removeClass('dragover');
      $(e.currentTarget).addClass('dragover');
      e.preventDefault();
    }

    ,dragover: function(e){
      e.originalEvent.dataTransfer.dropEffect = 'move';
      e.preventDefault();
    }

    ,onItemviewDragend: function(view, e){
      view.$el.removeClass('dragging');
      this.$('.storage-pokemon-view').removeClass('dragover');
    }

    ,drop: function(e){
      e.stopPropagation();
      e.preventDefault();
      var position = this.$('.storage-pokemon-view').index(e.currentTarget);
      var boxId = this.collection.boxId;
      this.collection.move(this.dragSource.model, {boxId: boxId, position: position});
    }

    ,sortPokemon: function(e){
      var me = this;
      me.collection.each(function(pokemon){
        var grid = me.ui.grid.eq(pokemon.get('position'));
        if (grid.find('.storage-pokemon-view-empty').size()) {
          grid.empty();
        }
        me.children.findByModel(pokemon).$el.appendTo(grid);
      });
      me.ui.grid.each(function(i, grid){
        if (!$(grid).children().size()) {
          $('<div/>').addClass('storage-pokemon-view storage-pokemon-view-empty')
            .appendTo(grid);
        }
      });
    }

    ,sortStorage: function(e){
      e.preventDefault();
      var me = this, sortBy = $(e.target).data('sort');
      vent.trigger('modal', {
        title: i18n.t('action.storage-sort')
        ,content: i18n.t('action.storage-sort-confirm')
        ,type: 'confirm'
        ,btnType: 'primary'
        ,accept: function(){
          me.collection.sortStorage(sortBy);
        }
      });
    }
  });

  return StorageView;
});
