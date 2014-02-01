define([
  'jquery'
  ,'underscore'
  ,'backbone'
  ,'marionette'
  ,'i18next'
  ,'text!templates/menu.html'
  ,'util'
], function($, _, Backbone, Marionette, i18n, menuTemplate){

  var MenuView = Marionette.ItemView.extend({
    id: 'menu'
    ,tagName: 'ul'

    ,template: _.template(menuTemplate)
    ,templateHelpers: { t: i18n.t }

    ,options: {
      disableUpdate: false
    }

    ,events: {
      'click a[href]': 'navigate'
    }

    ,initialize: function(){
      this.listenTo(Backbone.history, 'route', this.update);
    }

    ,navigate: function(e){
      e.preventDefault();
      this.options.disableUpdate = true;
      Backbone.history.navigate(e.target.pathname, {trigger: true});
      this.options.disableUpdate = false;
    }

    ,update: function(router, route){
      var path = _.invert(router.appRoutes)[route];
      path = path && path.split('/')[0];
      
      this.$('.selected').removeClass('selected');
      var item = this.$('a[href="/' + path + '"]').addClass('selected');

      if (!this.options.disableUpdate) {
        item.closest('.collapse').prev().trigger('click');
      }
    }
  });
  
  return MenuView;
});