define([
  'jquery'
  ,'underscore'
  ,'backbone'
  ,'router'
  ,'i18next'
  ,'moment'
  ,'views/menu'
  ,'moment-lang/zh-cn'
  ,'moment-lang/zh-tw'
  ,'bootstrap/dropdown'
  ,'bootstrap/collapse'
], function($, _, Backbone, Router, i18n, moment, MenuView){

  var initialize = function(){
    var router = new Router;
    var menu = new MenuView;

    router.bind('route', function(route){
      menu.update(route);
    });

    // Template helpers
    // From https://github.com/rotundasoftware/underscore-template-helpers
    _.originalTemplate = _.template;
    _.templateHelpers = {
      _: _
      ,moment: moment
      ,t: i18n.t
    };
    _.template = function(text, data, setting){
      if (data) {
        _.defaults(data, _.templateHelpers);
        return _.originalTemplate.apply(this, arguments);
      }

      var template = _.originalTemplate.apply(this, arguments);
      var wrappedTemplate = function(data) {
        if (data) _.defaults(data, _.templateHelpers);
        return template.apply(this,arguments);
      };

      return wrappedTemplate;
    };

    // load locales
    i18n.init({
      lng: Paradise.locale,
      fallbackLng: false,
      load: 'current',
      lowerCaseLng: true,
      ns: {
        namespaces: ['app', 'pokemon', 'item', 'location'],
        defaultNs: 'app'
      }
    }, function(){

      var momentLngName = {'zh-hans': 'zh-cn', 'zh-hant': 'zh-tw'};
      moment.lang(momentLngName[Paradise.locale] || Paradise.locale);

      $(function(){
        $('#paradise-app').append(menu.render().el);
        Backbone.history.start({pushState: true});
      });
    });
  };

  return {
    initialize: initialize
  };
});