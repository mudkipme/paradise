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

    ,serializeData: function(){
      return {
        region: this.options.region
        ,map: mapData[this.options.region]
      };
    }

    ,onRender: function(){
      this.$el.find('[title]').tooltip();
    }
  });

  return RegionView;
});