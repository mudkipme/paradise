define([
  'jquery'
  ,'underscore'
  ,'marionette'
  ,'i18next'
  ,'models/daycare'
  ,'text!templates/daycare-room.html'
], function($, _, Marionette, i18n, DayCare, dayCareRoomTemplate){

  var DayCareRoomView = Marionette.ItemView.extend({
    className: 'day-care-room'
    ,model: DayCare

    ,template: _.template(dayCareRoomTemplate)
    ,templateHelpers: { t: i18n.t }
  });

  return DayCareListView;
});