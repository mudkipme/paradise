define([
  'jquery'
  ,'underscore'
  ,'backbone'
  ,'marionette'
  ,'i18next'
  ,'text!templates/alert.html'
  ,'bootstrap/alert'
], function($, _, Backbone, Marionette, i18n, alertTemplate){

  var AlertView = Marionette.ItemView.extend({
    className: 'alert fade in'

    ,template: _.template(alertTemplate)
    ,templateHelpers: { t: i18n.t }

    ,initialize: function(options){
      this.model = new Backbone.Model({options: options});
    }

    ,onRender: function(){
      if (this.options.type) {
        this.$el.addClass('alert-' + this.options.type);
      }
      this.$el.alert();
    }
  });

  return AlertView;
});