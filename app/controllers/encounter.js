var async = require('async');
var _ = require('underscore');
var Item = require('../models/item');
var Location = require('../models/location');
var Battle = require('../models/battle');

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
    if (err) return res.json(500, {error: err.message});
    req.trainer.encounter.battleResult = result.result;
    req.trainer.encounter.battlePokemon = pokemonA;

    req.trainer.save(function(err){
      if (err) return res.json(500, {error: err.message});
      res.json(result);
    });
  });
};

// Catch the wild Pokémon
exports.catch = function(req, res){
  var pokemon = req.trainer.encounter.pokemon;
  var location = req.trainer.encounter.location;
  if (!pokemon)
    return res.json(404, {error: 'NO_ENCOUNTER_POKEMON'});

  Item(parseInt(req.body.itemId), function(err, pokeBall){
    if (err) return res.json(500, {error: err.message});

    var hp = pokemon.stats.maxHp;
    if (req.trainer.encounter.battleResult == 'win') {
      hp = Math.round(hp / 10);
    }
    var shakeResult = pokeBall.catchResult(req.trainer, hp);

    // Success
    if (shakeResult == 4) {
      clearEncounter(req.trainer);
      req.trainer.catchPokemon(pokemon, pokeBall, location, function(err){
        if (err) return res.json(500, {error: err.message});
        res.json({shake: shakeResult, pokemon: pokemon});
      });
    } else {
      res.json({shake: shakeResult, pokemon: pokemon});
    }
  });
};

// Escape from the current wild Pokémon
exports.escape = function(req, res){
  var pokemon = req.trainer.encounter.pokemon;
  if (!pokemon)
    return res.json(404, {error: 'NO_ENCOUNTER_POKEMON'});

  async.series([
    pokemon.remove.bind(pokemon)

    ,function(next){
      clearEncounter(req.trainer);
      req.trainer.save(next);
    }
  ], function(err){
    if (err) res.json(500, {error: err.message});
    res.send(204);
  });
};