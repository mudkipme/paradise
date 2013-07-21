define([
  'jquery'
  ,'underscore'
  ,'backbone'
  ,'i18next'
  ,'text!templates/menu.html'
], function($, _, Backbone, i18n, menuTemplate){

  var MenuView = Backbone.View.extend({
    id: 'menu-view'
    ,className: 'span3'

    ,events: {
      'click a[data-href]': 'navigate'
      ,'click .collapsible a': 'collapse'
    }

    ,render: function(){
      this.$el.html(_.template(menuTemplate, {}));
      return this;
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