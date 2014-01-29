define([
  'jquery'
  ,'underscore'
  ,'backbone'
  ,'i18next'
  ,'views/pokemon'
], function($, _, Backbone, i18n, PokemonView){

  var helpers = PokemonView.prototype.templateHelpers;

  var contentTemplates = {
    'gift-item': "<%= t('msg.gift-item', {sender: sender.name, number: relatedNumber, item: t('item:'+relatedItem.name)}) %>"
    ,'event-pokemon': "<%= t('msg.event-pokemon', {pokemon: pokemonName(receiverPokemon)}) %>"
  };

  var Msg = Backbone.Model.extend({
    urlRoot: '/api/msg'

    ,defaults: {
      type: null
      ,content: null
      ,status: 0
      ,senderPokemon: null
      ,receiverPokemon: null
      ,relatedDayCare: null
      ,relatedItemId: null
      ,relatedNumber: 0
    }

    ,content: function(){
      if (contentTemplates[this.get('type')]) {
        var render = _.template(contentTemplates[this.get('type')]);
        return render(_.extend({
          t: i18n.t
          ,pokemonName: function(pokemon){
            return helpers.pokemonName.apply({pokemon: pokemon});
          }
        }, this.toJSON()));
      }
    }

    ,read: function(){
      var me = this;
      me.sync(null, me, {
        url: me.url() + '/read'
        ,type: 'POST'
        ,success: function(data){
          me.collection.fetch();
        }
      });
    }

    ,accept: function(){
      var me = this;
      me.sync(null, me, {
        url: me.url() + '/accept'
        ,type: 'POST'
        ,success: function(data){
          me.collection.fetch();
        }
      });
    }

    ,decline: function(){
      var me = this;
      me.sync(null, me, {
        url: me.url() + '/decline'
        ,type: 'POST'
        ,success: function(data){
          me.collection.fetch();
        }
      });
    }
  });

  return Msg;
});