define([
  'jquery'
  ,'underscore'
  ,'backbone'
  ,'util'
], function($, _, Backbone){

  var NavBarView = Backbone.View.extend({
    el: 'nav.navbar'

    ,events: {
      'click a[href]': 'navigate'
    }

    ,navigate: function(e){
      if ($(e.target).hasClass('switch-language')) {
        e.preventDefault();
        var language = $(e.target).data('language');
        var trainer = require('app').trainer;
        
        if (!trainer.isNew()) {
          trainer.save({language: language}, {patch: true, wait: true});
        } else {
          document.cookie = 'i18next=' + language;
          location.reload();
        }
      } else if (e.target.host == location.host) {
        e.preventDefault();
        Backbone.history.navigate(e.target.pathname, {trigger: true});
      }
    }
  });
  
  return NavBarView;
});