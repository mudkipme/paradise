var async = require('async');
var _ = require('underscore');
var Item = require('../models/item');
var Location = require('../models/location');
var Battle = require('../models/battle');
var config = require('../../config.json');

var clearEncounter = function(trainer){
  trainer.encounter.location = null;
  trainer.encounter.area = null;
  trainer.encounter.method = null;
  trainer.encounter.pokemon = null;
  trainer.encounter.battleResult = null;
  trainer.encounter.battlePokemon = null;
  trainer.encounter.time = null;
};

// Encounter a wild Pokémon
exports.post = function(req, res){
  async.waterfall([
    async.apply(Location, req.body.location)

    ,function(location, next){
      location.encounter(req.trainer, next);
    }
  ], function(err, encounter){
    if (err) return res.json(403, {error: err.message});
    res.json(encounter);
  });
};

// Battle with the wild Pokémon
exports.battle = function(req, res){
  if (req.trainer.encounter.battleResult)
    return res.json(403, {error: 'ALREADY_BATTLED'});

  var pokemonB = req.trainer.encounter.pokemon;
  if (!pokemonB)
    return res.json(404, {error: 'NO_ENCOUNTER_POKEMON'});

  var pokemonA = _.find(req.trainer.party, function(pokemon){
    return pokemon._id.equals(req.body.pokemonId);
  });
  if (!pokemonA)
    return res.json(404, {error: 'POKEMON_NOT_IN_PARTY'});

  Battle(pokemonA, pokemonB, {location: req.trainer.encounter.location}, function(err, result){
    if (err) return res.json(403, {error: err.message});
    req.trainer.encounter.battleResult = result.result;
    req.trainer.encounter.battlePokemon = pokemonA;

    var finish = function(){
      req.trainer.save(function(err){
        if (err) return res.json(500, {error: err.message});
        res.json(result);
      });
    };

    // If lost battle, the wild Pokémon might escape
    if (result.result == 'lose' && _.random(0, 99) < config.app.escapeRate) {
      pokemonB.remove(function(err){
        if (err) return res.json(500, {error: err.message});
        clearEncounter(req.trainer);
        result.escape = true;
        finish();
      });
    } else {
      finish();
    }
  });
};

// Catch the wild Pokémon
exports.catch = function(req, res){
  var pokemon = req.trainer.encounter.pokemon;
  var location = req.trainer.encounter.location;
  if (!pokemon)
    return res.json(404, {error: 'NO_ENCOUNTER_POKEMON'});

  var itemId = parseInt(req.body.itemId);

  if (!req.trainer.hasItem(itemId))
    return res.json(403, {error: 'NO_ENOUGH_ITEM_IN_BAG'});

  Item(itemId, function(err, pokeBall){
    if (err) return res.json(500, {error: err.message});

    var hp = pokemon.stats.maxHp;
    if (req.trainer.encounter.battleResult == 'win') {
      hp = Math.round(hp / 10);
    }
    var shakeResult = pokeBall.catchResult(req.trainer, hp);

    var actions = [
      req.trainer.removeItem.bind(req.trainer, itemId, 1)
    ];
    var result = { shake: shakeResult };

    // Success
    if (shakeResult == 4) {
      clearEncounter(req.trainer);
      actions.unshift(
        req.trainer.catchPokemon.bind(req.trainer, pokemon, pokeBall, location)
      );
    } else {
      if (_.random(0, 99) < config.app.escapeRate) {
        actions.unshift(pokemon.remove.bind(pokemon));
        clearEncounter(req.trainer);
        result.escape = true;
      }
    }

    async.series(actions, function(err){
      if (err) return res.json(500, {error: err.message});
      res.json(result);
      if (shakeResult == 4) {
        req.trainer.log('catch', {pokemon: pokemon});
      }
    });
  });
};

// Escape from the current wild Pokémon
exports.escape = function(req, res){
  var pokemon = req.trainer.encounter.pokemon;

  var actions = [
    function(next){
      clearEncounter(req.trainer);
      req.trainer.save(next);
    }
  ];

  if (pokemon) {
    actions.unshift(pokemon.remove.bind(pokemon));
  }

  async.series(actions, function(err){
    if (err) res.json(500, {error: err.message});
    res.send(204);
  });
};