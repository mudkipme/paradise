define([
  'marionette'
], function(Marionette){
  return Marionette.AppRouter.extend({
    appRoutes: {
      '': 'home'
      ,'party': 'party'
      ,'bag': 'bag'
    }
  });
});