define([
  'jquery'
  ,'underscore'
  ,'marionette'
  ,'i18next'
  ,'moment'
  ,'models/msg'
  ,'views/pokemon'
  ,'text!templates/msg.html'
  ,'util'
], function($, _, Marionette, i18n, moment, Msg, PokemonView, msgTemplate){

  var helpers = PokemonView.prototype.templateHelpers;
  var Status = { normal: 0, waiting: 1, accepted: 2, declined: 3, expired: 4 };

  var MsgView = Marionette.ItemView.extend({
    className: 'msg-view'
    ,tagName: 'li'
    ,model: Msg

    ,template: _.template(msgTemplate)
    ,templateHelpers: {
      t: i18n.t
      ,moment: moment
      ,Status: Status
      ,spriteUrl: function(pokemon){
        return helpers.spriteUrl.apply({pokemon: pokemon});
      }
      ,pokemonName: function(pokemon){
        return _.escape(helpers.pokemonName.apply({pokemon: pokemon}));
      }
    }

    ,events: {
      'click': 'read'
      ,'click .btn-accept': 'accept'
      ,'click .btn-decline': 'decline'
    }

    ,modelEvents: {
      'change': 'render'
    }

    ,ui: {
      'createTime': '.create-time'
    }

    ,onRender: function(){
      this.$el.toggleClass('unread', !this.model.get('read'));
      this.ui.createTime.tooltip({placement: 'left'});
    }

    ,read: function(){
      if (this.model.get('read')) return;
      this.model.read();
    }

    ,accept: function(e){
      e.stopPropagation();
      this.model.accept();
    }

    ,decline: function(e){
      e.stopPropagation();
      this.model.decline();
    }
  });

  return MsgView;
});