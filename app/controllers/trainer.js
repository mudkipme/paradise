/**
 * Trainer RESTful Controller
 * @module controllers/trainer
 */

// dependencies
var async = require('async');
var Trainer = require('../models/trainer');
var Pokemon = require('../models/pokemon');
var Item = require('../models/item');

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