define([
  'jquery'
  ,'underscore'
  ,'marionette'
  ,'i18next'
  ,'text!templates/pokemart.html'
], function($, _, Marionette, i18n, pokeMartTemplate){

  var PokeMartView = Marionette.ItemView.extend({
    id: 'poke-mart-view'

    ,template: _.template(pokeMartTemplate)
    ,templateHelpers: { t: i18n.t }

    ,ui: {
      clerkEye: '.clerk .clerk-eye'
    }

    ,onRender: function(){
      this.blinkEye();
    }

    ,blinkEye: function(){
      var me = this, index = 0;

      me.blink = setTimeout(function blink(){
        index = (index + 1) % 9;
        var id = 5 - Math.abs(index % 9 - 4);
        
        me.ui.clerkEye.prop('className', 'clerk-eye clerk-eye-' + id);
        me.blink = setTimeout(blink, (index == 0) ? 4000 : 70);
      }, 4000);
    }

    ,onBeforeClose: function(){
      clearTimeout(this.blink);
    }
  });

  return PokeMartView;
});