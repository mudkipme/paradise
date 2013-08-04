define([
  'jquery'
  ,'underscore'
  ,'backbone'
  ,'marionette'
  ,'i18next'
  ,'text!templates/modal.html'
  ,'bootstrap/modal'
], function($, _, Backbone, Marionette, i18n, modalTemplate){

  var ModalView = Marionette.ItemView.extend({
    className: 'modal fade'

    ,events: {
      'click .btn-accept': 'accept'
    }

    ,template: _.template(modalTemplate)
    ,templateHelpers: { t: i18n.t }

    ,initialize: function(){
      this.model = new Backbone.Model({options: this.options});
    }

    ,onBeforeClose: function(){
      if (this.$el.attr('aria-hidden') === 'false') {
        this.$el.modal('hide');
        return false;
      }
    }

    ,accept: function(){
      if (this.options.accept) {
        this.options.accept.apply(this);
      }
    }
  });

  return ModalView;
});