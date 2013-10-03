define([
  'jquery'
  ,'underscore'
  ,'marionette'
  ,'i18next'
  ,'text!templates/region.html'
  ,'data/map'
  ,'util'
], function($, _, Marionette, i18n, regionTemplate, mapData){

  var RegionView = Marionette.ItemView.extend({
    id: 'region-view'

    ,template: _.template(regionTemplate)
    ,templateHelpers: { t: i18n.t }

    ,events: {
      'click .location': 'chooseLocation'
    }

    ,initialize: function(){
      this.encounter = require('app').trainer.encounter;
      this.listenTo(this.encounter, 'change', this.gotoLocation);
    }

    ,serializeData: function(){
      return {
        region: this.options.region
        ,map: mapData[this.options.region]
      };
    }

    ,onRender: function(){
      this.$el.find('[title]').tooltip();
    }

    ,onShow: function(){
      var me = this;
      _.defer(function(){
        me.gotoLocation();
      });
    }

    ,gotoLocation: function(){
      if (this.encounter.get('location')) {
        Backbone.history.navigate('/encounter', {trigger: true});
      }
    }

    ,chooseLocation: function(e){
      var location = $(e.currentTarget).data('location');
      this.encounter.goto(location);
    }
  });

  return RegionView;
});