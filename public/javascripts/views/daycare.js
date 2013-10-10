define([
  'jquery'
  ,'underscore'
  ,'marionette'
  ,'i18next'
  ,'views/party-select'
  ,'views/daycare-list'
  ,'text!templates/daycare.html'
], function($, _, Marionette, i18n, PartySelectView, DayCareListView, dayCareTemplate){

  var DayCareView = Marionette.Layout.extend({
    id: 'day-care-view'

    ,template: _.template(dayCareTemplate)
    ,templateHelpers: { t: i18n.t }

    ,regions: {
      partySelect: '.party-select'
      ,dayCareList: '.day-care-list'
    }

    ,events: {
      'click section:not(.open)': 'openSection'
      ,'click section h1': 'titleClick'
    }

    ,onRender: function(){
      var party = this.collection.trainer.party;
      this.partySelectView = new PartySelectView({collection: party});
      this.listenTo(this.partySelectView, 'choose', _.bind(this.deposit, this));
      this.partySelect.show(this.partySelectView);
      this.dayCareList.show(new DayCareListView({collection: this.collection}));
    }

    ,openSection: function(e){
      $(e.currentTarget).addClass('open');
    }

    ,titleClick: function(e){
      $(e.target).closest('section').toggleClass('open');
    }

    ,deposit: function(pokemon){
      this.collection.deposit(pokemon);
    }
  });

  return DayCareView;
});