requirejs.config({
  paths: {
    templates: '../templates'
    ,text: '../components/requirejs-text/text'
    ,jquery: '../components/jquery/jquery'
    ,'juqery-transit': '../components/jquery.transit/jquery.transit'
    ,underscore: '../components/underscore-amd/underscore'
    ,backbone: '../components/backbone-amd/backbone'
    ,i18next: '../components/i18next/release/i18next.amd.withJQuery-1.6.3'
    ,moment: '../components/moment/moment'
    ,'moment-lang': '../components/moment/min/lang'
    ,bootstrap: '../components/bootstrap/js/'
    ,'bootstrap-switch': '../components/bootstrap-switch/static/js/bootstrap-switch'
  },
  shim: {
    'juqery-transit': { deps: ['jquery'] }
    ,'bootstrap/dropdown': { deps: ['jquery'] }
    ,'bootstrap/collapse': { deps: ['jquery'] }
    ,'bootstrap/tooltip': { deps: ['jquery'] }
    ,'bootstrap-switch': { deps: ['jquery'] }
  }
});

require(['app'], function(app){
  app.initialize();
});