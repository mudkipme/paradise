define([
  'jquery'
  ,'underscore'
  ,'marionette'
  ,'i18next'
  ,'vent'
  ,'models/item'
  ,'views/party-popover'
  ,'views/pokemon-events'
  ,'text!templates/item.html'
  ,'text!templates/item-gift.html'
  ,'util'
], function($, _, Marionette, i18n, vent, Item, PartyPopoverView, PokemonEventsView, itemTemplate, itemGiftTemplate){

  var ItemView = Marionette.ItemView.extend({
    className: 'item-view'
    ,model: Item

    ,ui: {
      'description': '.description'
      ,'use': '.btn-use'
      ,'gift': '.btn-gift'
      ,'hold': '.btn-hold'
      ,'number': '.number span'
    }

    ,events: {
      'submit .gift-form': 'giftSubmit'
      ,'selectPokemon .btn-hold': 'holdItem'
      ,'selectPokemon .btn-use': 'useItem'
      ,'shown.bs.popover .actions .btn-hold': 'showPartyPopover'
      ,'shown.bs.popover .actions .btn-use': 'showPartyPopover'
    }

    ,modelEvents: {
      'change:number': 'changeNumber'
      ,'gift': 'giftDone'
      ,'hold': 'holdDone'
      ,'use': 'useDone'
    }

    ,template: _.template(itemTemplate)
    ,templateHelpers: { t: i18n.t }

    ,initialize: function(){
      this.listenTo(vent, 'windowResize', this.ellipsisDesc);
      this.listenTo(vent, 'popover', this.hidePopover);
    }

    ,onRender: function(){
      var me = this;

      me.partyPopover = new PartyPopoverView({
        collection: require('app').trainer.party
      });
      me.partyPopover.render();

      var popoverOpts = {
        html: true
        ,content: me.partyPopover.el
        ,container: me.el
        ,placement: 'bottom'
      };

      me.ui.gift.popover(_.defaults({
        content: function(){
          var itemData = me.mixinTemplateHelpers(me.serializeData());
          return _.template(itemGiftTemplate, itemData);
        }
      }, popoverOpts));


      me.ui.hold.popover(popoverOpts);
      me.ui.use.popover(popoverOpts);
    }

    ,onShow: function(){
      this.ellipsisDesc();
    }

    ,showPartyPopover: function(e){
      this.partyPopover.delegateEvents();
      this.partyPopover.options.button = $(e.currentTarget);
      require('app').trainer.fetch();
    }

    ,onClose: function(){
      if (this.partyPopover) {
        this.partyPopover.close();
      }
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
      this.$('.actions button').each(function(i, button){
        if (!e || button !== e.target) {
          var popover = $(button).data('bs.popover');
          popover && popover.leave(popover);
        }
      });
    }

    ,giftSubmit: function(e){
      this.model.gift(this.$('.gift-trainer').val(), this.$('.gift-number').val());
      var popover = this.ui.gift.data('bs.popover');
      popover && popover.leave(popover);
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
      this.hidePopover();
    }

    ,useItem: function(e, pokemon){
      pokemon.useItem(this.model);
      this.hidePopover();
    }

    ,holdDone: function(pokemon){
      var item = i18n.t('item:' + this.model.get('item').name);
      var pokemonName = _.escape(pokemon.get('nickname'))
        || i18n.t('pokemon:' + pokemon.get('species').name);

      vent.trigger('alert', {
        type: 'success'
        ,title: i18n.t('action.hold-item')
        ,content: i18n.t('action.hold-done', {pokemon: pokemonName, item: item})
      });
    }

    ,useDone: function(pokemon, events, oldPokemon){
      var item = i18n.t('item:' + this.model.get('item').name);
      var pokemonName = _.escape(oldPokemon.nickname)
        || i18n.t('pokemon:' + oldPokemon.species.name);

      vent.trigger('alert', {
        type: 'success'
        ,title: i18n.t('action.use-item')
        ,content: i18n.t('action.use-done', {pokemon: pokemonName, item: item})
        ,view: new PokemonEventsView({
          model: pokemon
          ,pokemonEvents: events
          ,oldPokemon: oldPokemon
        })
      });
    }

    ,changeNumber: function(){
      this.ui.number.text(this.model.get('number'));
    }
  });

  return ItemView;
});