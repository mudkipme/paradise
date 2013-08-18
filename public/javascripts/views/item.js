define([
  'jquery'
  ,'underscore'
  ,'marionette'
  ,'i18next'
  ,'vent'
  ,'models/item'
  ,'views/party-popover'
  ,'text!templates/item.html'
  ,'text!templates/item-gift.html'
  ,'util'
], function($, _, Marionette, i18n, vent, Item, PartyPopoverView, itemTemplate, itemGiftTemplate){

  var ItemView = Marionette.ItemView.extend({
    className: 'item-view'
    ,model: Item

    ,ui: {
      'description': '.description'
      ,'gift': '.btn-gift'
      ,'hold': '.btn-hold'
      ,'number': '.number span'
    }

    ,events: {
      'submit .gift-form': 'giftSubmit'
      ,'selectPokemon .btn-hold': 'holdItem'
    }

    ,modelEvents: {
      'change:number': 'changeNumber'
      ,'gift': 'giftDone'
      ,'hold': 'holdDone'
    }

    ,template: _.template(itemTemplate)
    ,templateHelpers: { t: i18n.t }

    ,onRender: function(){
      var me = this;

      me.listenTo(vent, 'windowResize', me.ellipsisDesc);
      me.listenTo(vent, 'popover', me.hidePopover);

      var popoverOpts = {
        html: true
        ,container: me.el
        ,placement: 'bottom'
      };

      me.ui.gift.popover(_.defaults({
        content: function(){
          var itemData = me.mixinTemplateHelpers(me.serializeData());
          return _.template(itemGiftTemplate, itemData);
        }
      }, popoverOpts));

      me.ui.hold.popover(_.defaults({
        content: function(){
          if (!me.partyPopover) {
            me.partyPopover = new PartyPopoverView({ collection: require('app').trainer.party });
          } else {
            me.partyPopover.button = me.ui.hold;
          }
          return me.partyPopover.render().el;
        }
      }, popoverOpts));
    }

    ,onShow: function(){
      this.ellipsisDesc();
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
      _.each([this.ui.gift, this.ui.hold], function(button){
        if (button.get(0) !== e.target) {
          button.popover('hide');
        }
      });
    }

    ,giftSubmit: function(e){
      this.model.gift(this.$('.gift-trainer').val(), this.$('.gift-number').val());
      this.ui.gift.popover('hide');
      e.preventDefault();
    }

    ,giftDone: function(e){
      var item = i18n.t('item:' + this.model.get('item').name);
      vent.trigger('alert', {
        type: 'success'
        ,title: i18n.t('action.gift-item')
        ,content: i18n.t('action.gift-done', _.extend({item: item}, e))
      });
    }

    ,holdItem: function(e, pokemon){
      pokemon.holdItem(this.model);
      this.ui.hold.popover('hide');
    }

    ,holdDone: function(e){
      var item = i18n.t('item:' + this.model.get('item').name);
      var pokemon = _.escape(e.pokemon.get('nickname'))
        || i18n.t('pokemon:' + e.pokemon.get('species').name);

      vent.trigger('alert', {
        type: 'success'
        ,title: i18n.t('action.hold-item')
        ,content: i18n.t('action.hold-done', {pokemon: pokemon, item: item})
      });
    }

    ,changeNumber: function(){
      this.ui.number.text(this.model.get('number'));
    }
  });

  return ItemView;
});