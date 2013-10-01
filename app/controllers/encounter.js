var async = require('async');
var Location = require('../models/location');
var Battle = require('../models/battle');

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

};

// Catch the wild Pokémon
exports.catch = function(req, res){

};

// Escape from the current wild Pokémon
exports.escape = function(req, res){
  var pokemon = req.trainer.encounter.pokemon;
  if (!pokemon)
    return res.json(404, 'NO_ENCOUNTER_POKEMON');

  async.series([
    pokemon.remove.bind(pokemon)

    ,function(next){
      req.trainer.encounter = {};
      req.trainer.save(next);
    }
  ], function(err){
    if (err) res.json(500, {error: err.message});
    res.send(204);
  });
};