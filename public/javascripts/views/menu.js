define([
  'jquery'
  ,'underscore'
  ,'backbone'
  ,'marionette'
  ,'i18next'
  ,'text!templates/menu.html'
], function($, _, Backbone, Marionette, i18n, menuTemplate){

  var MenuView = Marionette.ItemView.extend({
    id: 'menu-view'

    ,template: _.template(menuTemplate)
    ,templateHelpers: { t: i18n.t }

    ,events: {
      'click a[data-href]': 'navigate'
      ,'click .collapsible a': 'collapse'
    }

    ,navigate: function(e){
      Backbone.history.navigate($(e.target).data('href'), {trigger: true});
    }

    ,collapse: function(e){
      var li = $(e.target).closest('li');
      li.find('ul').slideToggle();
      li.toggleClass('collapsed');
    }

    ,update: function(route){
      this.$('.selected').removeClass('selected');
      this.$('a[data-href="/' + route + '"]')
      .parent()
      .addClass('selected')
      .closest('.collapsed')
      .removeClass('collapsed');
    }
  });
  return MenuView;
});