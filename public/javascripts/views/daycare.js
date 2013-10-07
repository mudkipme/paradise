define([
  'jquery'
  ,'underscore'
  ,'marionette'
  ,'i18next'
  ,'text!templates/daycare.html'
], function($, _, Marionette, i18n, dayCareTemplate){

  var DayCareView = Marionette.Layout.extend({
    id: 'day-care-view'

    ,template: _.template(dayCareTemplate)
    ,templateHelpers: { t: i18n.t }
  });

  return DayCareView;
});