define([
  'marionette'
], function(Marionette){
  return Marionette.AppRouter.extend({
    appRoutes: {
      '': 'home'
      ,'party': 'party'
      ,'bag': 'bag'
      ,'pokemart': 'pokeMart'
      ,'storage': 'storage'
      ,'world': 'world'
      ,'world/:region': 'region'
      ,'encounter': 'encounter'
      ,'pokedex': 'pokedex'
      ,'daycare': 'daycare'
      ,'trainer': 'trainer'
      ,'timeline': 'timeline'
      ,'trade': 'trade'
      ,'battle': 'battle'
      ,'rank': 'rank'
      ,'migrate': 'migrate'
      ,'setting': 'setting'
      ,'record': 'record'
      ,'help': 'help'
      ,'msg': 'msg'
    }
  });
});