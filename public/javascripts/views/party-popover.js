define([
  'jquery'
  ,'underscore'
  ,'marionette'
  ,'i18next'
  ,'text!templates/party-popover.html'
], function($, _, Marionette, i18n, partyPopoverTemplate){

  var PartyPopoverView = Marionette.ItemView.extend({
    className: 'party-popover-view'

    ,template: _.template(partyPopoverTemplate)
    ,templateHelpers: { t: i18n.t }

    ,collectionEvents: {
      'add remove change sort': 'render'
    }

    ,events: {
      'click a': 'selectPokemon'
    }

    ,selectPokemon: function(e){
      e.preventDefault();
      var index = $(e.target).index();
      if (this.options.button) {
        this.options.button.trigger('selectPokemon', this.collection.at(index));
      }
    }
  });

  return PartyPopoverView;
});