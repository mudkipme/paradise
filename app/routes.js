// Controllers
var index = require('./controllers/index');
var bbs = require('./controllers/bbs');
var trainer = require('./controllers/trainer');
var pokemon = require('./controllers/pokemon');
var item = require('./controllers/item');
var storage = require('./controllers/storage');
var admin = require('./controllers/admin');
var encounter = require('./controllers/encounter');
var species = require('./controllers/species');
var daycare = require('./controllers/daycare');

// Middlewares
var auth = require('./middlewares/authentication');
var pm = require('./middlewares/pokemon-middleware');

var defaults = [auth.login, auth.trainer];
var isSelf = [auth.login, auth.trainer, auth.isSelf];
var page = [auth.login, auth.trainer, auth.locale];
var myPokemon = [auth.login, auth.trainer, pm.myPokemon];
var isAdmin = [auth.login, auth.isAdmin];

module.exports = function(app){
  app.get('/', page, index.index);
  app.get(/^\/(party|pokedex|bag|trainer|storage|world|encounter|timeline|pokemart|daycare|trade|battle|rank|migrate|setting|record|help)(\/.*)?$/, page, index.defaults);
  app.get('/bbs', bbs.login);

  // Trainer actions
  app.get('/api/trainer', defaults, trainer.get);
  app.post('/api/trainer', defaults, trainer.post);
  app.get('/api/trainer/:name', trainer.get);
  app.get('/api/trainer/:name/pokedex', trainer.pokedex);
  app.get('/api/trainer/:name/pokemon', trainer.pokemon);
  app.get('/api/trainer/:name/bag', isSelf, trainer.bag);
  app.put('/api/trainer/:name', isSelf, trainer.put);
  app.patch('/api/trainer/:name', isSelf, trainer.put);
  app.post('/api/trainer/:name/move', isSelf, trainer.move);

  // Pokémon actions
  app.param('pokemonId', pm.pokemon);
  app.get('/api/pokemon/:pokemonId', pokemon.get);
  app.post('/api/pokemon/:pokemonId/release', myPokemon, pokemon.release);
  app.post('/api/pokemon/:pokemonId/deposit', myPokemon, pokemon.deposit);
  app.post('/api/pokemon/:pokemonId/withdraw', myPokemon, pokemon.withdraw);
  app.put('/api/pokemon/:pokemonId', myPokemon, pokemon.put);
  app.patch('/api/pokemon/:pokemonId', myPokemon, pokemon.put);
  app.post('/api/pokemon/:pokemonId/hold-item', myPokemon, pokemon.holdItem);
  app.post('/api/pokemon/:pokemonId/take-item', myPokemon, pokemon.takeItem);
  app.post('/api/pokemon/:pokemonId/use-item', myPokemon, pokemon.useItem);
  app.post('/api/pokemon/:pokemonId/send-pokemon-center'
    , myPokemon, pokemon.sendPokemonCenter);

  // Item actions
  app.get('/api/item', defaults, item.list);
  app.get('/api/item/:itemId', defaults, item.get);
  app.post('/api/item/:itemId/gift', defaults, item.gift);
  app.post('/api/item/:itemId/buy', defaults, item.buy);
  
  // Storage actions
  app.get('/api/storage/:boxId', defaults, storage.get);
  app.put('/api/storage/:boxId', defaults, storage.put);
  app.patch('/api/storage/:boxId', defaults, storage.put);
  app.post('/api/storage/move', defaults, storage.move);
  app.post('/api/storage/sort', defaults, storage.sort);

  // Encounter actions
  app.post('/api/encounter', defaults, encounter.post);
  app.post('/api/encounter/battle', defaults, encounter.battle);
  app.post('/api/encounter/escape', defaults, encounter.escape);
  app.post('/api/encounter/catch', defaults, encounter.catch);

  // Species actions
  app.get('/api/species/:speciesId', species.get);

  // Day Care actions
  app.get('/api/daycare', defaults, daycare.list);
  app.post('/api/daycare', defaults, daycare.post);
  app.get('/api/daycare/:dayCareId', daycare.get);
  app.post('/api/daycare/:dayCareId/deposit', defaults, daycare.deposit);
  app.post('/api/daycare/:dayCareId/withdraw', defaults, daycare.withdraw);
  app.post('/api/daycare/:dayCareId/request', defaults, daycare.request);

  // Admin
  app.post('/api/admin/event-pokemon', isAdmin, admin.eventPokemon);
};