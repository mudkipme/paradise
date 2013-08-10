requirejs.config({
  paths: {
    templates: '../templates'
    ,text: '../components/requirejs-text/text'
    ,jquery: '../components/jquery/jquery'
    ,'jquery.transit': '../components/jquery.transit/jquery.transit'
    ,underscore: '../components/underscore/underscore'
    ,backbone: '../components/backbone/backbone'
    ,marionette: '../components/backbone.marionette/lib/core/amd/backbone.marionette'
    ,'backbone.wreqr': '../components/backbone.wreqr/lib/amd/backbone.wreqr'
    ,'backbone.babysitter': '../components/backbone.babysitter/lib/amd/backbone.babysitter'
    ,i18next: '../components/i18next/release/i18next.amd.withJQuery-1.6.3'
    ,moment: '../components/moment/moment'
    ,'moment/lang': '../components/moment/min/lang'
    ,bootstrap: '../components/bootstrap/js'
    ,'bootstrap/switch': '../components/bootstrap-switch/static/js/bootstrap-switch'
  }
  ,shim: {
    underscore: { exports: '_' }
    ,backbone: { exports: 'Backbone', deps: ['jquery', 'underscore'] }
    ,'juqery.transit': { deps: ['jquery'] }
    ,'bootstrap/alert': { deps: ['jquery', , 'bootstrap/transition'] }
    ,'bootstrap/collapse': { deps: ['jquery', 'bootstrap/transition'] }
    ,'bootstrap/modal': { deps: ['jquery', 'bootstrap/transition'] }
    ,'bootstrap/tooltip': { deps: ['jquery', 'bootstrap/transition'] }
    ,'bootstrap/transition': { deps: ['jquery'] }
    ,'bootstrap/switch': { deps: ['jquery'] }
  }
});

require(['app'], function(App){
  App.start();
});