define([
  'jquery'
  ,'underscore'
  ,'marionette'
  ,'i18next'
  ,'text!templates/pokedex.html'
  ,'text!templates/entry-infobox.html'
  ,'text!templates/entry-sprites.html'
  ,'util'
], function($, _, Marionette, i18n, pokedexTemplate, infoboxTemplate, spritesTemplate){

  var PokedexView = Marionette.ItemView.extend({
    id: 'pokedex-view'

    ,template: _.template(pokedexTemplate)
    ,templateHelpers: { t: i18n.t }

    ,infoboxTemplate: _.template(infoboxTemplate)
    ,spritesTemplate: _.template(spritesTemplate)

    ,events: {
      'click .pokedex-list li.seen': 'openEntry'
      ,'mousewheel .list-container': 'listWheel'
      ,'click .scroll-container': 'clickScroll'
      ,'slid.bs.carousel #pokedex-sprites': 'slideSprites'
      ,'dragdown .list-container': 'listDragDown'
      ,'dragup .list-container': 'listDragUp'
    }

    ,ui: {
      pokedexGrid: '.pokedex-list li.seen'
      ,pokedexList: '.list-container'
      ,scrollBlock: '.scroll-block'
      ,infobox: '.entry-infobox .infobox-content'
      ,entry: '.pokedex-entry'
      ,entryTop: '.pokedex-entry .top'
      ,entryContent: '.pokedex-entry .content'
      ,entryBottom: '.pokedex-entry .bottom'
    }

    ,collectionEvents: {
      'add remove change reset': 'render'
      ,'update': 'updateInfobox'
    }

    ,onRender: function(){
      var entry = this.collection.findWhere({seen: true});
      if (entry) {
        this.ui.pokedexGrid
        .filter('[data-number="' + entry.get('speciesNumber') + '"]')
        .addClass('selected');
        this.selectedEntry = entry;
        this.showSprites(entry);
      }
      this.$el.hammer();
    }

    ,openEntry: function(e){
      var me = this;
      me.ui.pokedexGrid.removeClass('selected');
      var number = $(e.currentTarget).addClass('selected').data('number');
      var entry = me.collection.findWhere({speciesNumber: number});
      var height = me.ui.entry.height() / 2;
      me.ui.entry.appear();

      // animation when open the entry
      $.when(me.ui.entryTop.transition({height: height + 14})
        ,me.ui.entryBottom.transition({height: height})
        ,me.ui.entryContent.transition({top: height, bottom: height})
        ,me.ui.infobox.transition({opacity: 0}))
      .done(function(){
        me.selectedEntry = entry;
        me.showSprites(entry);
        
        if (entry.get('caught')) {
          me.ui.entry.addClass('caught');
        } else {
          me.ui.entry.removeClass('caught');
        }

        me.ui.entryTop.transition({height: ''});
        me.ui.entryBottom.transition({height: ''});
        me.ui.entryContent.transition({top: '', bottom: ''});
        me.ui.infobox.transition({opacity: ''});
      });
    }

    ,showSprites: function(entry){
      var data = this.mixinTemplateHelpers(entry.toJSON());
      this.ui.entryContent.html(this.spritesTemplate(data));
      if (entry.get('forms').length > 1) {
        this.$('#pokedex-sprites').carousel();
      }

      this.updateInfobox(entry);
      entry.updateEntry(entry.get('forms')[0].form);
    }

    ,slideSprites: function(e){
      var form = this.$('#pokedex-sprites .active').data('form');
      this.selectedEntry.updateEntry(form);
    }

    ,updateInfobox: function(entry){
      if (entry.get('speciesNumber') != this.selectedEntry.get('speciesNumber')) {
        return;
      }

      var data = this.mixinTemplateHelpers(entry.toJSON());
      this.ui.infobox.html(this.infoboxTemplate(data));
    }

    ,updateScroll: function(){
      var list = this.ui.pokedexList;
      var block = this.ui.scrollBlock;
      var percent = list.scrollTop() / (list.find('ul').height() - list.height());
      block.css('top', (block.parent().height() - block.height()) * percent);
    }

    ,listScroll: function(delta){
      var list = this.ui.pokedexList;
      var height = this.ui.pokedexGrid.outerHeight();
      this._delta = this._delta ? this._delta - delta : -delta;
      if (this._delta < 0) {
        this._delta = 0;
      }
      if (this._delta > list.find('ul').height() - list.height()) {
        this._delta = list.find('ul').height() - list.height();
      }

      this.ui.pokedexList.scrollTop(Math.round(this._delta/height) * height);
      this.updateScroll();
    }

    ,listDragUp: function(e){
      e.gesture.preventDefault();
      this.listScroll(e.gesture.deltaY / 2);
    }

    ,listDragDown: function(e){
      e.gesture.preventDefault();
      this.listScroll(e.gesture.deltaY / 2);
    }

    ,listWheel: function(e){
      e.preventDefault();
      this.listScroll(e.deltaFactor * e.deltaY);
    }

    ,clickScroll: function(e){
      var list = this.ui.pokedexList;
      var scroll = $(e.currentTarget);
      if ($(e.target).hasClass('scroll-block')) return;
      var percent = (e.offsetY - 5) / (scroll.outerHeight() - 10);
      this._delta = percent * (list.find('ul').height() - list.height());
      this.listScroll(0);
    }
  });

  return PokedexView;
});