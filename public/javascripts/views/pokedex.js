define([
  'jquery'
  ,'underscore'
  ,'marionette'
  ,'i18next'
  ,'text!templates/pokedex.html'
  ,'util'
  ,'backbone.hammer'
], function($, _, Marionette, i18n, pokedexTemplate){

  var PokedexView = Marionette.ItemView.extend({
    id: 'pokedex-view'

    ,template: _.template(pokedexTemplate)
    ,templateHelpers: { t: i18n.t }

    ,events: {
      'click .pokedex-list li.seen': 'openEntry'
      ,'mousewheel .list-container': 'listWheel'
      ,'click .scroll-container': 'clickScroll'
    }

    ,hammerEvents: {
      'dragdown .list-container': 'listDragDown'
      ,'dragup .list-container': 'listDragUp'
    }

    ,ui: {
      pokedexGrid: '.pokedex-list li.seen'
      ,pokedexList: '.list-container'
      ,scrollBlock: '.scroll-block'
    }

    ,collectionEvents: {
      'add remove change reset': 'render'
    }

    ,onRender: function(){
      this.ui.pokedexGrid.first().click();
    }

    ,openEntry: function(e){
      this.ui.pokedexGrid.removeClass('selected');
      var number = $(e.currentTarget).addClass('selected').data('number');
    }

    ,updateScroll: function(){
      var list = this.ui.pokedexList;
      var block = this.ui.scrollBlock;
      var percent = list.scrollTop() / (list.find('ul').height() - list.height());
      block.css('top', (block.parent().height() - block.height()) * percent);
    }

    ,listScroll: function(delta){
      var height = this.ui.pokedexGrid.outerHeight();
      this._delta = this._delta ? this._delta + delta : delta;

      this.ui.pokedexList.scrollTop(Math.round(-this._delta/height) * height);
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

    ,listWheel: function(e, delta){
      e.preventDefault();
      this.listScroll(delta);
    }

    ,clickScroll: function(e){
      var list = this.ui.pokedexList;
      var scroll = $(e.currentTarget);
      var percent = (e.offsetY - 5) / (scroll.outerHeight() - 10);
      this._delta = -percent * (list.find('ul').height() - list.height());
      this.listScroll(0);
    }
  });

  return PokedexView;
});