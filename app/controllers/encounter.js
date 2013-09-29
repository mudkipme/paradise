var async = require('async');
var Location = require('../models/location');

// Encounter a wild Pokémon
exports.post = function(req, res){
  async.waterfall([
    async.apply(Location, req.body.location)

    ,function(location, next){
      location.encounter(req.trainer, next);
    }
  ], function(err, pokemon){
    if (err) return res.json(403, {error: err.message});

    res.json({
      location: req.body.location
      ,pokemon: pokemon || null
    });
  });
};

// Battle with the wild Pokémon
exports.battle = function(req, res){

};

// Catch the wild Pokémon
exports.catch = function(req, res){

};

// Escape from the current wild Pokémon
exports.escape = function(req, res){
  if (!req.trainer.wildPokemon)
    return res.json(404, 'NO_ENCOUNTER_POKEMON');

  async.series([
    req.trainer.wildPokemon.remove.bind(req.trainer.wildPokemon)

    ,function(next){
      req.trainer.currentLocation = null;
      req.trainer.wildPokemon = null;
      req.trainer.save(next);
    }
  ], function(err){
    if (err) res.json(500, {error: err.message});
    res.send(204);
  });
};