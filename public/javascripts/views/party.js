define([
  'jquery'
  ,'underscore'
  ,'marionette'
  ,'views/pokemon'
  ,'vent'
  ,'util'
], function($, _, Marionette, PokemonView, vent){

  var PartyView = Marionette.CollectionView.extend({
    id: 'party-view'

    ,itemView: PokemonView

    ,collectionEvents: {
      'sort': 'sortPokemon'
    }

    ,onRender: function(){
      this.listenTo(vent, 'io:party:add', this.pokemonAdded);
    }

    ,pokemonAdded: function(pokemon){
      pokemon = this.collection.get(pokemon.id);
      if (pokemon) {
        var el = this.children.findByModel(pokemon).$el;
        el.css({'opacity': 0}).offset();
        el.transition({'opacity': 1});
      }
    }

    ,onAfterItemAdded: function(view){
      if (this.options.draggable !== false) {
        view.$el.prop('draggable', true);
      }
    }

    ,onItemviewBeforeExpand: function(itemView){
      this.children.each(function(child){
        child.collapse();
      });
    }

    ,removeItemView: function(item){
      var me = this, view = this.children.findByModel(item);
      
      view.$el.transition({opacity: 0}, function(){
        me.removeChildView(view);
        me.checkEmpty();
      });
    }

    ,onItemviewDragstart: function(view, e){
      this.dragSource = view;
      view.trigger('before:expand');

      view.$el.addClass('dragging');
      e.originalEvent.dataTransfer.effectAllowed = 'move';
      e.originalEvent.dataTransfer.setData('Text', view.model.get('id'));
    }

    ,onItemviewDragenter: function(view, e){
      this.children.each(function(child){
        child.$el.removeClass('dragover');
      });
      view.$el.addClass('dragover');

      var typeColor = view.$('.type .label').css('background-color');
      view.$('.drag-ring').css('border-color', typeColor);
    }

    ,onItemviewDragover: function(view, e){
      e.originalEvent.dataTransfer.dropEffect = 'move';
      e.preventDefault();
    }

    ,onItemviewDragend: function(view, e){
      view.$el.removeClass('dragging');
      this.children.each(function(child){
        child.$el.removeClass('dragover');
      });
    }

    ,onItemviewDrop: function(view, e){
      e.stopPropagation();
      e.preventDefault();
      if (this.dragSource && this.dragSource != view) {
        this.collection.swap(this.dragSource.model, view.model);
      }
    }

    ,sortPokemon: function(){
      var me = this;
      me.collection.each(function(pokemon, index){
        me.$el.children().eq(index).before(me.children.findByModel(pokemon).el);
      });
    }
  });
  
  return PartyView;
});