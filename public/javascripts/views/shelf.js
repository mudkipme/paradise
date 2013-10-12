define([
  'jquery'
  ,'underscore'
  ,'marionette'
  ,'i18next'
  ,'vent'
  ,'text!templates/shelf.html'
  ,'text!templates/item-buy.html'
  ,'util'
], function($, _, Marionette, i18n, vent, shelfTemplate, itemBuyTemplate){

  var ShelfView = Marionette.ItemView.extend({
    className: 'shelf-view'

    ,template: _.template(shelfTemplate)
    ,templateHelpers: { t: i18n.t }

    ,events: {
      'click .shelf-item *': 'showItem'
      ,'shown.bs.popover .shelf-item': 'initPopover'
      ,'mouseenter .shelf-item': 'showDescription'
    }

    ,collectionEvents: {
      'buy': 'buyDone'
    }

    ,ui: {
      shelfItems: '.shelf-item'
    }

    ,serializeData: function(){
      var pocket = this.collection.filterPocket(this.options.pocket);
      return {
        items: _.map(pocket, function(item){
          return item.toJSON();
        })
      };
    }

    ,initialize: function(options){
      this.pokeMart = options.pokeMart;
      this.listenTo(vent, 'windowResize', this.setPosition);
    }

    ,onRender: function(){
      var me = this;

      me.setPosition();

      // Fade in the shelf
      me.$el.css('opacity', 0).offset();
      me.$el.transition({'opacity': 1});

      // Add item buy popover to the items on the shelf
      me.ui.shelfItems.popover({
        content: function(){
          var id = $(this).data('id')
             ,item = me.collection.get(id)
             ,itemData = me.mixinTemplateHelpers(item.toJSON());
          return _.template(itemBuyTemplate, itemData);
        }
        ,html: true
        ,placement: function(){
          if (this.$element.offset().top < 125) {
            return 'bottom';
          } else {
            return 'top';
          }
        }
        ,container: 'body'
        ,trigger: 'manual'
      });
    }

    // Set the position of the shelf
    ,setPosition: function(){
      var shelves = this.pokeMart.ui.shelves;
      this.$el.css('height', shelves.height());
      this.$el.css('max-width', shelves.width());
    }

    ,showItem: function(e){
      e.stopPropagation();
      var popover = $(e.currentTarget).closest('.shelf-item').data('bs.popover');
      popover && popover.toggle();
    }

    // Remove all popovers on close
    ,onClose: function(){
      this.ui.shelfItems.each(function(i, item){
        var popover = $(item).data('bs.popover');
        popover && popover.tip().detach();
      });
      this.pokeMart.hideTalk();
      clearTimeout(this.descTimer);
    }

    ,showDescription: function(e){
      if (this.disableDesc) {
        return;
      }
      var id = $(e.currentTarget).data('id')
         ,item = this.collection.get(id);
      this.pokeMart.talk(i18n.t('item:description.' + item.get('item').name));
    }

    ,initPopover: function(e){
      var me = this;

      // Hide other popovers
      me.ui.shelfItems.each(function(i, item){
        if (item !== e.currentTarget) {
          var popover = $(item).data('bs.popover');
          popover && popover.leave(popover);
        }
      });

      // Bind events to item buy popover in a traditional way
      var popover = $(e.currentTarget).data('bs.popover')
         ,tip = popover.tip()
         ,id = $(e.currentTarget).data('id')
         ,item = me.collection.get(id);

      tip.off('submit change keyup');

      tip.on('submit', '.buy-form', function(e){
        e.preventDefault();
        item.buy(tip.find('.item-buy-number').val());
        popover.leave(popover);
      });

      tip.on('change keyup', '.item-buy-number', function(e){
        var number = parseInt($(e.currentTarget).val());
        if (isNaN(number) || number < 0) {
          number = 0;
        }
        tip.find('.number').text( item.get('number') + number );
      });
    }

    // Finish buying an item
    ,buyDone: function(item, number){
      var me = this;
      var itemName = i18n.t('item:' + item.get('item').name);
      var message = i18n.t('action.buy-done', {item: itemName, number: number});

      if (item.get('item').name == 'poke-ball' && number >= 10) {
        message += i18n.t('action.buy-done-gift', {
          item: i18n.t('item:premier-ball')
          ,number: 1
        });
      }

      me.pokeMart.talk(message, true, 'success');
      me.disableDesc = true;
      me.descTimer = setTimeout(function(){
        me.disableDesc = false;
      }, 2500);
    }
  });

  return ShelfView;
});