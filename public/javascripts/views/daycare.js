define([
  'jquery'
  ,'underscore'
  ,'marionette'
  ,'i18next'
  ,'vent'
  ,'views/party-select'
  ,'views/daycare-list'
  ,'models/daycare'
  ,'text!templates/daycare.html'
], function($, _, Marionette, i18n, vent, PartySelectView, DayCareListView, DayCare, dayCareTemplate){

  var helpers = PartySelectView.prototype.templateHelpers;

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
      this.listenTo(party, 'deposit', this.deposited);
    }

    ,openSection: function(e){
      $(e.currentTarget).addClass('open');
    }

    ,titleClick: function(e){
      $(e.target).closest('section').toggleClass('open');
    }

    ,deposit: function(pokemon){
      var me = this;
      var space = me.collection.some(function(dayCare){
        if (!dayCare.get('pokemonB') && !dayCare.get('egg')) {
          dayCare.deposit(pokemon);
          return true;
        }
      });
      if (!space) {
        var dayCare = new DayCare({ pokemonA: pokemon.get('id') });
        dayCare.once('sync', function(){
          me.collection.add(dayCare);
          pokemon.trigger('deposit', pokemon);
        });
        dayCare.save();
      }
    }

    ,deposited: function(pokemon){
      pokemon = helpers.pokemonName(pokemon.toJSON());
      vent.trigger('alert', {
        type: 'success'
        ,title: i18n.t('day-care.deposit')
        ,content: i18n.t('day-care.deposited', {pokemon: pokemon})
      });
      this.$('section.withdraw').addClass('open');
    }
  });

  return DayCareView;
});