define([
  'jquery'
  ,'underscore'
  ,'marionette'
  ,'i18next'
  ,'vent'
  ,'models/item'
  ,'text!templates/item.html'
], function($, _, Marionette, i18n, vent, Item, itemTemplate){

  var ItemView = Marionette.ItemView.extend({
    className: 'item-view'
    ,model: Item

    ,template: _.template(itemTemplate)
    ,templateHelpers: {
      t: i18n.t
      ,imgBase: PARADISE.imgBase
    }
  });

  return ItemView;
});