var index = require('./controllers/index');
var bbs = require('./controllers/bbs');
var trainer = require('./controllers/trainer');
var pokemon = require('./controllers/pokemon');
var auth = require('./middlewares/authentication');
var pm = require('./middlewares/pokemon-middleware');

var defaults = [auth.login, auth.trainer, auth.locale];
var isSelf = [auth.login, auth.trainer, auth.isSelf];
var selfPokemon = [auth.login, auth.trainer, pm.selfPokemon];

module.exports = function(app) {
  app.get('/', defaults, index.index);
  app.get('/party', defaults, index.index);
  app.get('/bbs', bbs.login);

  // Trainer actions
  app.get('/api/trainer', [auth.login, auth.trainer], trainer.get);
  app.post('/api/trainer', [auth.login, auth.trainer], trainer.post);
  app.get('/api/trainer/:name', trainer.get);
  app.get('/api/trainer/:name/pokedex', trainer.pokedex);
  app.get('/api/trainer/:name/pokemon', trainer.pokemon);
  app.get('/api/trainer/:name/bag', isSelf, trainer.bag);
  app.put('/api/trainer/:name/accept-battle', isSelf, trainer.acceptBattle);
  app.put('/api/trainer/:name/real-world', isSelf, trainer.realWorld);
  app.post('/api/trainer/:name/move', isSelf, trainer.move);

  // Pokémon actions
  app.param('pokemonId', pm.pokemon);
  app.get('/api/pokemon/:pokemonId', pokemon.get);
  app.post('/api/pokemon/:pokemonId/release', selfPokemon, pokemon.release);
  app.post('/api/pokemon/:pokemonId/deposit', selfPokemon, pokemon.deposit);
  app.post('/api/pokemon/:pokemonId/withdraw', selfPokemon, pokemon.withdraw);
  app.put('/api/pokemon/:pokemonId', selfPokemon, pokemon.put);
  app.patch('/api/pokemon/:pokemonId', selfPokemon, pokemon.put);
  app.post('/api/pokemon/:pokemonId/hold-item', selfPokemon, pokemon.holdItem);
  app.post('/api/pokemon/:pokemonId/hold-item/take'
    , selfPokemon, pokemon.takeHoldItem);
};