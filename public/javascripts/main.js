requirejs.config({
  paths: {
    templates: "../templates",
    text: "libs/text",
    i18n: "libs/i18n",
    jquery: "//code.jquery.com/jquery-2.0.2.min",
    underscore: "//cdn.jsdelivr.net/underscorejs/1.4.4/underscore-min",
    backbone: "//cdn.jsdelivr.net/backbonejs/1.0.0/backbone-min",
    bootstrap: "//netdna.bootstrapcdn.com/twitter-bootstrap/2.3.2/js/bootstrap.min",
    kinetic: "libs/kinetic-v4.5.4",
    color: "libs/color-0.4.4"
  },
  shim: {
    underscore: {
      exports: "_"
    },
    backbone: {
      deps: ["underscore", "jquery"],
      exports: "Backbone"
    },
    bootstrap: {
      deps: ["jquery"],
      exports: "$"
    },
    color: {
      exports: "Color"
    }
  }
});

require([
  'router',
  'bootstrap'
], function(Router){
  Router.initialize();
});