requirejs.config({
  paths: {
    templates: '../templates'
    ,text: '../components/requirejs-text/text'
    ,jquery: '../components/jquery/jquery'
    ,'juqery-transit': '../components/jquery.transit/jquery.transit'
    ,underscore: '../components/underscore/underscore'
    ,backbone: '../components/backbone/backbone'
    ,marionette: '../components/backbone.marionette/lib/backbone.marionette'
    ,i18next: '../components/i18next/release/i18next.amd.withJQuery-1.6.3'
    ,moment: '../components/moment/moment'
    ,'moment-lang': '../components/moment/min/lang'
    ,bootstrap: '../components/bootstrap/js'
    ,'bootstrap-switch': '../components/bootstrap-switch/static/js/bootstrap-switch'
  },
  shim: {
    underscore: { exports: '_' }
    ,backbone: { exports: 'Backbone', deps: ['jquery', 'underscore'] }
    ,marionette: { exports: 'Marionette', deps: ['jquery', 'underscore', 'backbone'] }
    ,'juqery-transit': { deps: ['jquery'] }
    ,'bootstrap/collapse': { deps: ['jquery'] }
    ,'bootstrap/tooltip': { deps: ['jquery'] }
    ,'bootstrap/transition': { deps: ['jquery'] }
    ,'bootstrap-switch': { deps: ['jquery'] }
  }
});

require(['app', 'router', 'controller'], function(App, Router, Controller){
  App.vent.bind('locale:load', function(){
    App.appRouter = new Router({controller: new Controller});
    App.appRouter.bind('route', function(route){
      App.vent.trigger('route', route);
    });
    Backbone.history.start({pushState: true});
  });

  App.start(PARADISE);
});