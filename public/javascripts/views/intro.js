define([
  'jquery'
  ,'underscore'
  ,'backbone'
  ,'marionette'
  ,'i18next'
  ,'text!templates/intro.html'
  ,'util'
], function($, _, Backbone, Marionette, i18n, introTemplate){

  var IntroView = Marionette.ItemView.extend({
    id: 'intro-view'

    ,template: _.template(introTemplate)
    ,templateHelpers: { t: i18n.t }

    ,events: {
      'click .screen.next': 'nextScreen'
    }

    ,nextScreen: function(e){
      var scr = $(e.currentTarget);
      scr.transition({opacity: 0, y: -50}, function(){
        scr.addClass('hide');
        scr.next().removeClass('hide').css({opacity: 0, y: 50}).offset();
        scr.next().transition({opacity: 1, y: 0});
      });
    }
  });

  return IntroView;
});