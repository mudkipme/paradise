define([
  'jquery'
  ,'underscore'
  ,'marionette'
  ,'i18next'
  ,'vent'
  ,'models/item'
  ,'text!templates/item.html'
  ,'text!templates/item-gift.html'
  ,'util'
], function($, _, Marionette, i18n, vent, Item, itemTemplate, itemGiftTemplate){

  var ItemView = Marionette.ItemView.extend({
    className: 'item-view'
    ,model: Item

    ,ui: {
      'description': '.description'
      ,'gift': '.btn-gift'
    }

    ,events: {
      'submit .gift-form': 'giftSubmit'
    }

    ,template: _.template(itemTemplate)
    ,templateHelpers: { t: i18n.t }

    ,onRender: function(){
      _.defer(_.bind(this.ellipsisDesc, this));
      this.listenTo(vent, 'windowResize', this.ellipsisDesc);
      this.listenTo(vent, 'popover', this.hidePopover);

      var itemData = this.mixinTemplateHelpers(this.serializeData());

      this.ui.gift.popover({
        content: _.template(itemGiftTemplate, itemData)
        ,html: true
        ,container: this.el
        ,placement: 'bottom'
      });
    }

    // Truncate long descriptions
    ,ellipsisDesc: function(){
      var desc = this.ui.description;
      var title = i18n.t('item:description.' + this.model.get('item').name);
      var length = title.length;

      desc.text(title).tooltip('destroy');

      while (desc.prop('scrollHeight') > desc.height()) {
        if (length == title.length) {
          desc.prop('title', title);
          desc.tooltip({placement: 'bottom'});
        }
        length -= 1;
        desc.text(title.substr(0, length) + '...');
      }
    }

    ,hidePopover: function(e){
      _.each([this.ui.gift], function(button){
        if (button.get(0) !== e.target) {
          button.popover('hide');
        }
      });
    }

    ,giftSubmit: function(e){
      e.preventDefault();
    }
  });

  return ItemView;
});