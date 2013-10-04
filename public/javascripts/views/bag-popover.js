define([
  'jquery'
  ,'underscore'
  ,'marionette'
  ,'i18next'
  ,'text!templates/bag-popover.html'
], function($, _, Marionette, i18n, bagPopoverTemplate){

  var BagPopoverView = Marionette.ItemView.extend({
    className: 'bag-popover-view'

    ,template: _.template(bagPopoverTemplate)
    ,templateHelpers: { t: i18n.t }

    ,collectionEvents: {
      'add remove change reset': 'render'
    }

    ,serializeData: function(){
      var me = this;
      var items = me.collection.toJSON();
      if (me.options.pocket) {
        items = _.filter(items, function(item){
          return item.item.pocket == me.options.pocket;
        });
      }
      return {items: items, pocket: this.options.pocket};
    }

    ,events: {
      'click a': 'selectItem'
    }

    ,selectItem: function(e){
      e.preventDefault();
      var id = $(e.currentTarget).data('id');
      if (this.options.button) {
        this.options.button.trigger('selectItem', this.collection.get(id));
      }
    }
  });

  return BagPopoverView;
});