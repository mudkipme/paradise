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
      'add': 'render'
      ,'remove': 'render'
      ,'reset': 'render'
    }

    ,events: {
      'click a': 'selectPokemon'
    }

    ,initialize: function(options){
      this.button = options.button;
    }

    ,selectPokemon: function(e){
      e.preventDefault();
      var index = $(e.target).index();
      this.button.trigger('selectPokemon', this.collection.at(index));
    }
  });

  return PartyPopoverView;
});