// Controllers
var index = require('./controllers/index');
var bbs = require('./controllers/bbs');
var trainer = require('./controllers/trainer');
var pokemon = require('./controllers/pokemon');
var item = require('./controllers/item');
var storage = require('./controllers/storage');

// Middlewares
var auth = require('./middlewares/authentication');
var pm = require('./middlewares/pokemon-middleware');

var defaults = [auth.login, auth.trainer, auth.locale];
var isSelf = [auth.login, auth.trainer, auth.isSelf];
var myPokemon = [auth.login, auth.trainer, pm.myPokemon];

module.exports = function(app){
  app.get('/', defaults, index.index);
  app.get(/^\/(party|pokedex|bag|trainer|storage|world|timeline|pokemart|daycare|trade|battle|rank|migrate|setting|record|help)$/, defaults, index.defaults);
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
  app.post('/api/pokemon/:pokemonId/send-pokemon-center'
    , myPokemon, pokemon.sendPokemonCenter);

  // Item actions
  app.get('/api/item/:itemId', defaults, item.get);
  app.post('/api/item/:itemId/gift', defaults, item.gift);

  // Storage actions
  app.get('/api/storage/:boxId', defaults, storage.get);
  app.put('/api/storage/:boxId', defaults, storage.put);
  app.patch('/api/storage/:boxId', defaults, storage.put);
  app.post('/api/storage/move', defaults, storage.move);
  app.post('/api/storage/sort', defaults, storage.sort);
};