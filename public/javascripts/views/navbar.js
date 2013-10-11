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
        require('app').trainer.save({language: $(e.target).data('language')}, {wait: true});
      } else if (e.target.host == location.host) {
        e.preventDefault();
        Backbone.history.navigate(e.target.pathname, {trigger: true});
      }
    }
  });
  
  return NavBarView;
});