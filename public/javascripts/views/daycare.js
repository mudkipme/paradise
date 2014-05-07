define([
  'jquery'
  ,'underscore'
  ,'marionette'
  ,'i18next'
  ,'vent'
  ,'views/party-select'
  ,'views/daycare-list'
  ,'views/daycare-room-other'
  ,'models/daycare'
  ,'collections/daycares'
  ,'text!templates/daycare.html'
], function($, _, Marionette, i18n, vent, PartySelectView, DayCareListView, OtherDayCareRoomView, DayCare, DayCares, dayCareTemplate){

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
      ,'submit .search-day-care': 'searchDayCare'
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
      var dayCare = new DayCare({ pokemonA: pokemon.get('id') });
      dayCare.once('sync', function(){
        me.collection.add(dayCare);
        pokemon.trigger('deposit', pokemon);
      });
      dayCare.save();
    }

    ,deposited: function(pokemon){
      pokemon = helpers.pokemonName(pokemon.toJSON());
      vent.trigger('alert', {
        type: 'success'
        ,title: i18n.t('day-care.deposit')
        ,content: i18n.t('day-care.deposited', {pokemon: _.escape(pokemon)})
      });
      this.$('section.withdraw').addClass('open');
    }

    ,searchDayCare: function(e){
      e.preventDefault();
      var trainerName = $.trim(this.$('.search-input').val());
      if (!trainerName || trainerName == this.collection.trainer.get('name')) {
        vent.trigger('alert', {
          type: 'warning'
          ,title: i18n.t('day-care.deposit')
          ,content: i18n.t('day-care.invalid-trainer')
        });
        return;
      }

      var dayCares = new DayCares([], {trainer: this.$('.search-input').val()});
      dayCares.once('sync', function(){
        if (dayCares.size() == 0) {
          vent.trigger('alert', {
            type: 'warning'
            ,title: i18n.t('day-care.deposit')
            ,content: i18n.t('day-care.no-available')
          });
          return;
        }
        vent.trigger('modal', {
          view: new DayCareListView({collection: dayCares, itemView: OtherDayCareRoomView})
        });
      });
      dayCares.fetch();
    }
  });

  return DayCareView;
});