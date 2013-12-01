define([
  'jquery'
  ,'underscore'
  ,'backbone'
  ,'i18next'
], function($, _, Backbone, i18n){

  var contentTemplates = {
    'gift-item': "<%= sender.name %> 向你赠送了 <%= relatedNumber %> 个 <%= t('item:'+relatedItem.name) %>"
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
        return render(_.extend({t: i18n.t}, this.toJSON()));
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