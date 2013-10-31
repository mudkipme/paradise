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

    ,initialize: function(){
      $(document).ajaxStart(_.bind(this.ajaxStart, this));
      $(document).ajaxStop(_.bind(this.ajaxStop, this));
    }

    ,ajaxStart: function(){
      this.$('.ajax-loading').addClass('visible').offset();
      this.$('.ajax-loading').transition({opacity: 1});
    }

    ,ajaxStop: function(){
      this.$('.ajax-loading').stop().transition({opacity: 0}, function(){
        $(this).removeClass('visible');
      });
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