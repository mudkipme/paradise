define([
  'jquery'
  ,'underscore'
  ,'marionette'
  ,'i18next'
  ,'text!templates/alert.html'
  ,'bootstrap/alert'
], function($, _, Marionette, i18n, alertTemplate){

  var AlertView = Marionette.ItemView.extend({
    className: 'alert alert-dismissable fade in'

    ,template: _.template(alertTemplate)
    ,templateHelpers: { t: i18n.t }

    ,serializeData: function(){
      return {
        options: this.options
      }
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