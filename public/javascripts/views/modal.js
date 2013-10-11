define([
  'jquery'
  ,'underscore'
  ,'marionette'
  ,'i18next'
  ,'text!templates/modal.html'
  ,'util'
], function($, _, Marionette, i18n, modalTemplate){

  var ModalView = Marionette.ItemView.extend({
    className: 'modal fade'

    ,events: {
      'click .btn-accept': 'accept'
      ,'hidden.bs.modal': 'hidden'
    }

    ,template: _.template(modalTemplate)
    ,templateHelpers: { t: i18n.t }

    ,serializeData: function(){
      return {
        options: this.options
      }
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

    ,hidden: function(){
      if (this.options.hidden) {
        this.options.hidden.apply(this);
      }
    }
  });

  return ModalView;
});