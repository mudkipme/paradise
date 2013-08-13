define([
  'jquery'
  ,'underscore'
  ,'marionette'
  ,'i18next'
  ,'collections/pocket'
  ,'views/item'
  ,'text!templates/bag.html'
], function($, _, Marionette, i18n, Pocket, ItemView, bagTemplate){

  var BagView = Marionette.CompositeView.extend({
    id: 'pokemon-view'
    ,collection: Pocket

    ,itemView: ItemView
    ,itemViewContainer: '.item-container'

    ,template: _.template(bagTemplate)
    ,templateHelpers: {
      t: i18n.t
    }
  });

  return BagView;
});