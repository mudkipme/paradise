requirejs.config({
  paths: {
    templates: '../templates'
    ,text: '../components/requirejs-text/text'
    ,jquery: '../components/jquery/jquery'
    ,'jquery.transit': '../components/jquery.transit/jquery.transit'
    ,'jquery.mousewheel': '../components/jquery-mousewheel/jquery.mousewheel'
    ,bootstrap: '../components/bootstrap/dist/js/bootstrap'
    ,underscore: '../components/underscore/underscore'
    ,hammer: '../components/hammerjs/hammer'
    ,'jquery.hammer': '../components/jquery-hammerjs/jquery.hammer-standalone'
    ,backbone: '../components/backbone/backbone'
    ,marionette: '../components/backbone.marionette/lib/core/amd/backbone.marionette'
    ,'backbone.wreqr': '../components/backbone.wreqr/lib/amd/backbone.wreqr'
    ,'backbone.babysitter': '../components/backbone.babysitter/lib/amd/backbone.babysitter'
    ,i18next: '../components/i18next/release/i18next.amd.withJQuery-1.7.1'
    ,moment: '../components/moment/moment'
    ,'moment/lang': '../components/moment/lang'
    ,'socket.io': '../components/socket.io-client/dist/socket.io'
    ,kinetic: '../components/kineticjs/kinetic'
  }
  ,shim: {
    underscore: { exports: '_' }
    ,backbone: { exports: 'Backbone', deps: ['jquery', 'underscore'] }
    ,'juqery.transit': { deps: ['jquery'] }
    ,'bootstrap': { deps: ['jquery'] }
  }
});

require(['app'], function(App){
  App.start();
});