define([
  'jquery'
  ,'underscore'
  ,'marionette'
  ,'i18next'
  ,'views/pokemon'
  ,'views/party-select'
  ,'text!templates/encounter.html'
  ,'util'
], function($, _, Marionette, i18n, PokemonView, PartySelectView, encounterTemplate){

  var EncounterView = Marionette.Layout.extend({
    id: 'encounter-view'

    ,template: _.template(encounterTemplate)
    ,templateHelpers: PokemonView.prototype.templateHelpers

    ,regions: {
      partySelect: '.party-select'
    }

    ,serializeData: function(){
      var data = this.model.toJSON();
      var time = new Date(this.model.trainer.localTime);
      data.timeOfDay = this.model.trainer.get('timeOfDay');
      if (data.timeOfDay == 'day' && time.getHours() >= 17) {
        data.timeOfDay = 'twilight';
      }
      return data;
    }

    ,onShow: function(){
      var party = require('app').trainer.party;
      this.partySelect.show(new PartySelectView({collection: party}));
    }
  });

  return EncounterView;
});