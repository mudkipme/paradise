define([
  'jquery'
  ,'underscore'
  ,'marionette'
  ,'i18next'
  ,'vent'
  ,'models/item'
  ,'behaviors/party-popover'
  ,'views/pokemon-events'
  ,'text!templates/item.html'
  ,'text!templates/item-gift.html'
  ,'util'
], function($, _, Marionette, i18n, vent, Item, PartyPopover, PokemonEventsView, itemTemplate, itemGiftTemplate){

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

    ,behaviors: {
      PartyPopover: {
        behaviorClass: PartyPopover
      }
    }

    ,events: {
      'submit .gift-form': 'giftSubmit'
      ,'selectPokemon .btn-hold': 'holdItem'
      ,'selectPokemon .btn-use': 'useItem'
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
    }

    ,onRender: function(){
      var me = this;

      me.listenTo(vent, 'popover', me.hidePopover);
      me.ui.gift.popover({
        html: true
        ,content: function(){
          var itemData = me.mixinTemplateHelpers(me.serializeData());
          return _.template(itemGiftTemplate, itemData);
        }
        ,container: me.el
        ,placement: 'bottom'
      });
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
      if (!e || e.target != this.ui.gift.get(0)) {
        var popover = this.ui.gift.data('bs.popover');
        popover && popover.leave(popover);
      }
    }

    ,giftSubmit: function(e){
      this.model.gift(this.$('.gift-trainer').val(), this.$('.gift-number').val());
      this.hidePopover();
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
    }

    ,useItem: function(e, pokemon){
      pokemon.useItem(this.model);
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