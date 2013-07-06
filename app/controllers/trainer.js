/**
 * Trainer RESTful Controller
 * @module controllers/trainer
 */

// dependencies
var async = require('async');
var Trainer = require('../models/trainer');
var Pokemon = require('../models/pokemon');
var Item = require('../models/item');

// Get trainer's information
exports.get = function(req, res) {
  Trainer.findOne({ name: req.params.name })
  .populate('party')
  .exec(function(err, trainer){
    if (err) return res.json(500, { error: err.message });
    if (trainer) {
      trainer.initParty(function(err){
        if (err) return res.json(500, { error: err.message });
        res.json(trainer);
      });
    } else {
      res.json(404, { error: 'TRAINER_NOT_FOUND' });
    }
  });
};

// Get trainer's pokedex
exports.pokedex = function(req, res) {
  Trainer.findOne({ name: req.params.name })
  .exec(function(err, trainer){
    if (err) return res.json(500, { error: err.message });
    if (trainer) {
      trainer.getPokedex(function(err, pokedex){
        if (err) return res.json(500, { error: err.message });
        res.json(pokedex);
      });
    } else {
      res.json(404, { error: 'TRAINER_NOT_FOUND' });
    }
  });
};

// Start one's own Pokémon journey
exports.post = function(req, res) {
  if (!req.member) return res.json(403, { error: 'ERR_NOT_LOGINED' });
  if (req.trainer) return res.json(403, { error: 'ERR_ALREADY_CREATED' });
  
  var trainer = new Trainer({ name: req.member.username });

  async.series({
    // Receive the Pokemon from lab
    pokemon: function(next){
      Pokemon.createPokemon({
        speciesNumber: parseInt(req.body.speciesNumber)
      }, next);
    },
    // Get a Poké Ball
    pokeBall: function(next){
      Item('poke-ball', next);
    },
    // Get the starter town
    location: function(next){
      next(null, { name: 'pallet-town' });
    }
  }, function(err, ret){
    if (err) return res.json(500, { error: err.message });
    trainer.catchPokemon(ret.pokemon, ret.pokeBall, ret.location, function(err){
      if (err) return res.json(500, { error: err.message });
      res.json( trainer );
    });
  });
};