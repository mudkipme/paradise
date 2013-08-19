define([
  'jquery'
  ,'underscore'
  ,'marionette'
  ,'i18next'
  ,'vent'
  ,'models/pokemon'
  ,'text!templates/pokemon.html'
  ,'util'
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
      ,tradable: '.tradable input'
    }

    ,events: {
      'click': 'toggle'
      ,'change .tradable input': 'setTradable'
      ,'click .name span': 'setNicknameBegin'
      ,'blur .name input': 'setNicknameEnd'
      ,'click .btn-send-pc': 'sendPokemonCenter'
      ,'click .btn-deposit': 'deposit'
      ,'click .btn-take-item': 'takeItem'
      ,'click .btn-release': 'release'
      ,'dragstart': 'bubbleDragEvent'
      ,'dragenter': 'bubbleDragEvent'
      ,'dragover': 'bubbleDragEvent'
      ,'dragend': 'bubbleDragEvent'
      ,'drop': 'bubbleDragEvent'
    }

    ,modelEvents: {
      'change': 'render'
      ,'takeItem': 'takeItemDone'
    }

    ,template: _.template(pokemonTemplate)
    ,templateHelpers: {
      t: i18n.t
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
      this.$('input[type="checkbox"]').iosSwitch();
      this.$('[title]').tooltip();
      if (!this.collapsed) {
        this.ui.content.show();
      }
    }

    ,collapse: function(){
      if (!this.collapsed) {
        this.ui.content.transUp();
        this.collapsed = true;
      }
    }

    ,expand: function(){
      if (this.collapsed) {
        this.trigger('before:expand');
        this.ui.content.transDown();
        this.collapsed = false;
      }
    }

    ,toggle: function(e){
      if ($(e.target).closest('.ios-switch').size()
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

    ,setTradable: function(){
      this.model.save({ tradable: this.ui.tradable.prop('checked') }
        ,{ patch: true, silent: true });
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

      me.$el.one('mouseup', _.throttle(function(){
        me.collapsible = true;
      }));
    }

    ,sendPokemonCenter: function(){
      this.model.sendPokemonCenter();
    }

    ,deposit: function(){
      this.model.deposit();
    }

    ,takeItem: function(){
      this.model.takeItem();
    }

    ,takeItemDone: function(item){
      var item = i18n.t('item:' + item.name);
      var pokemon = _.escape(this.model.get('nickname'))
        || i18n.t('pokemon:' + this.model.get('species').name);

      vent.trigger('alert', {
        type: 'success'
        ,title: i18n.t('action.take-item')
        ,content: i18n.t('action.take-done', {pokemon: pokemon, item: item})
      });
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
    ,bubbleDragEvent: function(e){
      this.trigger(e.type, e);
    }
  });

  return PokemonView;
});