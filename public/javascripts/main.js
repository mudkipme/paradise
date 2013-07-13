requirejs.config({
  paths: {
    templates: "../templates",
    text: "../components/requirejs-text/text",
    jquery: "../components/jquery/jquery",
    underscore: "../components/underscore-amd/underscore",
    backbone: "../components/backbone-amd/backbone",
    i18next: "../components/i18next/release/i18next.amd.withJQuery-1.6.3",
    'bootstrap-dropdown': "../components/bootstrap/js/bootstrap-dropdown"
  },
  shim: {
    'bootstrap-dropdown': {
      deps: ["jquery"],
      exports: "$.fn.dropdown"
    }
  }
});

require([
  'router',
  'bootstrap-dropdown'
], function(Router){
  Router.initialize();
});