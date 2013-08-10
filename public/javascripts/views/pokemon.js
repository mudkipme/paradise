define([
  'jquery'
  ,'underscore'
  ,'marionette'
  ,'i18next'
  ,'vent'
  ,'models/pokemon'
  ,'text!templates/pokemon.html'
  ,'bootstrap/tooltip'
  ,'bootstrap/switch'
], function($, _, Marionette, i18n, vent, Pokemon, pokemonTemplate){

  var Gender = { female: 1, male: 2, genderless: 3 };

  var PokemonView = Marionette.ItemView.extend({
    className: 'pokemon-view'
    ,model: Pokemon

    ,collapsible: true
    ,collapsed: true

    ,ui: {
      content: '.content'
      ,nicknameText: '.name span'
      ,nicknameInput: '.name input'
    }

    ,events: {
      'click': 'toggle'
      ,'switch-change .tradable .switch': 'setTradable'
      ,'click .name span': 'setNicknameBegin'
      ,'blur .name input': 'setNicknameEnd'
      ,'click .btn-send-pc': 'sendPokemonCenter'
      ,'click .btn-deposit': 'deposit'
      ,'click .btn-release': 'release'
      ,'dragstart': 'dragstart'
      ,'dragenter': 'dragenter'
      ,'dragover': 'dragover'
      ,'dragend': 'dragend'
      ,'drop': 'drop'
    }

    ,modelEvents: {
      'change:nickname': 'render'
      ,'change:pokemonCenterTime': 'render'
    }

    ,template: _.template(pokemonTemplate)
    ,templateHelpers: {
      t: i18n.t
      ,imgBase: PARADISE.imgBase
      ,Gender: Gender

      // Generate the sprite url of Pokémon
      ,spriteUrl: function(){
        var url = PARADISE.imgBase + '/pokemon/';
        var pokemon = this.pokemon;

        if (pokemon.isShiny) {
          url += 'shiny/';
        }
        if (pokemon.species.hasGenderDifferences && pokemon.gender == Gender.female) {
          url += 'female/';
        }
        url += pokemon.species.number;
        if (pokemon.formIdentifier) {
          url += '-' + pokemon.formIdentifier;
        }
        return url + '.png';
      }
    }

    // Wrap model data to avoid undefined error
    ,serializeData: function(){
      return {
        pokemon: this.model.toJSON()
      }
    }

    ,onRender: function(){
      this.$('.switch').bootstrapSwitch();
      this.$('[title]').tooltip();
      if (!this.collapsed) {
        this.ui.content.show();
      }
    }

    ,collapse: function(){
      if (!this.collapsed) {
        this.trigger('before:collapse');
        this.ui.content.slideUp();
        this.collapsed = true;
      }
    }

    ,expand: function(){
      if (this.collapsed) {
        this.trigger('before:expand');
        this.ui.content.slideDown();
        this.collapsed = false;
      }
    }

    ,toggle: function(e){
      if ($(e.target).closest('.switch').size()
        || e.target.tagName.toUpperCase() == 'BUTTON'
        || e.target.tagName.toUpperCase() == 'INPUT'
        || e.target.tagName.toUpperCase() == 'A'
        || !this.collapsible) {
        return;
      }
      if (this.collapsed) {
        this.expand();
      } else {
        this.collapse();
      }
    }

    ,setTradable: function(e, data){
      this.model.save({tradable: data.value}, {patch: true});
    }

    ,setNicknameBegin: function(e){
      e.stopPropagation();

      if (this.model.get('pokemonCenterTime')) return; 

      this.ui.nicknameText.hide();
      this.ui.nicknameInput.show().focus();
      this.collapsible = false;
    }

    ,setNicknameEnd: function(e){
      e.stopPropagation();
      var me = this;

      var nickname = me.ui.nicknameInput.val();
      if (nickname == i18n.t('pokemon:' + me.model.get('species').name)) {
        nickname = '';
      }
      me.model.save({nickname: nickname}, {patch: true});
      me.ui.nicknameText.show();
      me.ui.nicknameInput.hide();
      
      setTimeout(function(){
        me.collapsible = true;
      }, 100);
    }

    ,sendPokemonCenter: function(){
      this.model.sendPokemonCenter();
    }

    ,deposit: function(){
      this.model.deposit();
    }

    ,release: function(){
      var me = this;
      vent.trigger('modal', {
        title: i18n.t('action.release')
        ,content: i18n.t('action.release-confirm')
        ,type: 'confirm'
        ,btnType: 'danger'
        ,accept: function(){
          me.model.release();
        }
      });
    }

    // Bubble drag events to collection view
    ,dragstart: function(e){
      this.trigger('dragstart', e);
    }

    ,dragenter: function(e){
      this.trigger('dragenter', e);
    }

    ,dragover: function(e){
      this.trigger('dragover', e);
    }

    ,dragend: function(e){
      this.trigger('dragend', e);
    }

    ,drop: function(e){
      this.trigger('drop', e);
    }
  });

  return PokemonView;
});