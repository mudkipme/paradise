define([
  'jquery'
  ,'underscore'
  ,'marionette'
  ,'i18next'
  ,'vent'
  ,'views/pokemon'
  ,'text!templates/admin.html'
  ,'util'
], function($, _, Marionette, i18n, vent, PokemonView, adminViewTemplate){

  var helpers = PokemonView.prototype.templateHelpers;

  var AdminView = Marionette.ItemView.extend({
    id: 'admin-view'

    ,template: _.template(adminViewTemplate)
    ,templateHelpers: { t: i18n.t, Gender: helpers.Gender }

    ,ui: {
      tabs: '.nav-tabs'
      ,giftPokemon: '.gift-pokemon'
      ,giftPokemonSpecies: '.gift-pokemon [name="speciesNumber"]'
      ,giftPokemonNickname: '.gift-pokemon [name="nickname"]'
      ,giftPokemonFormLine: '.gift-pokemon-form-line'
      ,giftPokemonSubmit: '.gift-pokemon button[type="submit"]'
      ,giftItem: '.gift-item'
      ,giftItemSubmit: '.gift-item button[type="submit"]'
      ,sendMsg: '.send-msg'
      ,sendMsgTrainer: '.send-msg [name="trainer"]'
      ,sendMsgCheck: '.send-msg input[type="checkbox"]'
      ,sendMsgSubmit: '.send-msg button[type="submit"]'
    }

    ,events: {
      'change @ui.giftPokemonSpecies': 'displayGiftPokemonForm'
      ,'submit @ui.giftPokemon': 'giftPokemon'
      ,'submit @ui.giftItem': 'giftItem'
      ,'click @ui.sendMsgCheck': 'sendMsgCheck'
      ,'submit @ui.sendMsg': 'sendMsg'
    }

    ,modelEvents: {
      'change': 'render'
      ,'giftedPokemon': 'giftPokemonDone'
      ,'giftedItem': 'giftItemDone'
      ,'sentMsg': 'sendMsgDone'
    }

    ,onRender: function(){
      this.displayGiftPokemonForm();
    }

    ,serialize: function(ele){
      var params = ele.serializeArray();
      params = _.object(_.pluck(params, 'name'), _.pluck(params, 'value'));

      if (params.trainer) {
        params.trainer = _.map(params.trainer.split(','), function(trainer){
          return trainer.trim();
        });
      }

      return params;
    }

    // Display the formes of Pokémon Species
    ,displayGiftPokemonForm: function(){
      var select = this.ui.giftPokemonFormLine.find('select');
      var speciesNumber = this.ui.giftPokemonSpecies.val();
      var species = _.findWhere(this.model.get('forms'), {speciesNumber: speciesNumber});
      select.empty();
      this.ui.giftPokemonFormLine.hide();

      species && this.ui.giftPokemonNickname.prop('placeholder', i18n.t('pokemon:'+species.name));

      if (species && species.forms.length > 1) {
        this.ui.giftPokemonFormLine.show();
        _.each(species.forms, function(form){
          $('<option/>').text(i18n.t('forme.' + (form || 'normal')))
            .val(form).appendTo(select);
        });
      }
    }

    ,giftPokemon: function(e){
      e.preventDefault();

      var params = this.serialize(this.ui.giftPokemon);
      this.ui.giftPokemon.find('[data-stat]').each(function(){
        if ($(this).val()) {
          params.individual = params.individual || {};
          params.individual[$(this).data('stat')] = parseInt($(this).val());
        }
      });
      
      this.ui.giftPokemonSubmit.prop('disabled', true);
      this.model.giftPokemon(params);
    }

    ,giftPokemonDone: function(giftList){
      this.ui.giftPokemonSubmit.prop('disabled', false);

      var msgs = [];
      _.each(giftList, function(gift){
        var pokemonName = helpers.pokemonName.apply({pokemon: gift.pokemon});
        msgs.push(i18n.t('admin.gift-pokemon-alert', {trainer: _.escape(gift.trainer.name), pokemon: _.escape(pokemonName)}));
      });

      vent.trigger('alert', {
        type: 'success'
        ,title: i18n.t('admin.gift-pokemon')
        ,content: msgs.join('<br/>')
      });
    }

    ,giftItem: function(e){
      e.preventDefault();
      var params = this.serialize(this.ui.giftItem);

      this.ui.giftItemSubmit.prop('disabled', true);
      this.model.giftItem(params);
    }

    ,giftItemDone: function(giftList){
      this.ui.giftItemSubmit.prop('disabled', false);

      var msgs = [];
      _.each(giftList, function(gift){
        var itemName = i18n.t('item:' + gift.item.name);
        msgs.push(i18n.t('admin.gift-item-alert', {trainer: gift.trainer.name, item: itemName, number: gift.number}));
      });

      vent.trigger('alert', {
        type: 'success'
        ,title: i18n.t('admin.gift-item')
        ,content: msgs.join('<br/>')
      });
    }

    ,sendMsgCheck: function(e){
      this.ui.sendMsgCheck.not(e.currentTarget).prop('checked', false);
      if ($(e.currentTarget).prop('checked')) {
        this.ui.sendMsgTrainer.val('').prop('disabled', true);
      } else {
        this.ui.sendMsgTrainer.prop('disabled', false);
      }
    }

    ,sendMsg: function(e){
      e.preventDefault();
      var params = this.serialize(this.ui.sendMsg);

      this.ui.sendMsgSubmit.prop('disabled', true);
      this.model.sendMsg(params);
    }

    ,sendMsgDone: function(msgList){
      this.ui.sendMsgSubmit.prop('disabled', false);

      var msgs = [];
      _.each(msgList, function(msg){
        msgs.push(i18n.t('admin.send-msg-alert', {trainer: msg.receiver.name}));
      });

      vent.trigger('alert', {
        type: 'success'
        ,title: i18n.t('admin.send-msg')
        ,content: msgs.join('<br/>')
      });
    }
  });
  
  return AdminView;
});