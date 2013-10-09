define([
  'jquery'
  ,'underscore'
  ,'marionette'
  ,'i18next'
  ,'collections/daycares'
  ,'views/daycare-room'
  ,'text!templates/daycare-list.html'
  ,'util'
], function($, _, Marionette, i18n, DayCares, DayCareRoomView, dayCareListTemplate){

  var DayCareListView = Marionette.CompositeView.extend({
    id: 'day-care-carousel'
    ,className: 'carousel slide'
    ,collection: DayCares

    ,itemView: 'DayCareRoomView'
    ,itemViewContainer: '.carousel-inner'

    ,template: _.template(dayCareListTemplate)
    ,templateHelpers: { t: i18n.t }
  });

  return DayCareListView;
});