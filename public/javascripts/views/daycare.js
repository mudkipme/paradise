define([
  'jquery'
  ,'underscore'
  ,'marionette'
  ,'i18next'
  ,'views/party-select'
  ,'text!templates/daycare.html'
], function($, _, Marionette, i18n, PartySelectView, dayCareTemplate){

  var DayCareView = Marionette.Layout.extend({
    id: 'day-care-view'

    ,template: _.template(dayCareTemplate)
    ,templateHelpers: { t: i18n.t }

    ,regions: {
      partySelect: '.party-select'
      ,dayCareList: '.day-care-list'
    }

    ,onRender: function(){
      var party = this.collection.trainer.party;
      this.partySelectView = new PartySelectView({collection: party});
      this.partySelect.show(this.partySelectView);
    }
  });

  return DayCareView;
});