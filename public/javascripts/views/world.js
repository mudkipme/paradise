define([
  'jquery'
  ,'underscore'
  ,'marionette'
  ,'i18next'
  ,'text!templates/world.html'
  ,'util'
], function($, _, Marionette, i18n, worldTemplate){

  var WorldView = Marionette.ItemView.extend({
    id: 'world-view'

    ,template: _.template(worldTemplate)
    ,templateHelpers: { t: i18n.t }

    ,ui: {
      'text': '.text'
    }

    ,events: {
      'mouseenter svg g': 'hoverRegion'
      ,'mouseleave svg g': 'endHoverRegion'
      ,'click svg g': 'enterRegion'
    }

    ,hoverRegion: function(e){
      var region = e.currentTarget.className.baseVal;
      this.ui.text.filter('.' + region).show();
    }

    ,endHoverRegion: function(e){
      this.ui.text.hide();
    }

    ,enterRegion: function(e){
      var region = e.currentTarget.className.baseVal;
      Backbone.history.navigate('/world/' + region, {trigger: true});
    }
  });

  return WorldView;
});