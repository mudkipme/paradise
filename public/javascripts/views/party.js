define([
  'jquery'
  ,'underscore'
  ,'marionette'
  ,'views/pokemon'
  ,'util'
], function($, _, Marionette, PokemonView){

  var PartyView = Marionette.CollectionView.extend({
    id: 'party-view'

    ,itemView: PokemonView

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
      this.dragSrc = view;
      view.trigger('before:expand');

      view.$el.addClass('dragging');
      e.originalEvent.dataTransfer.effectAllowed = 'move';
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
      if (this.dragSrc && this.dragSrc != view) {
        var srcOrder = this.dragSrc.model.order;
        this.dragSrc.model.order = view.model.order;
        view.model.order = srcOrder;
        this.collection.sort();
        this.collection.trigger('move');
      }
    }
  });
  
  return PartyView;
});