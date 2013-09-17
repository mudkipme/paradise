var _ = require('underscore');
var async = require('async');
var Pokemon = require('../models/pokemon');
var Trainer = require('../models/trainer');
var Item = require('../models/Item');
var Location = require('../models/Location');

exports.eventPokemon = function(req, res){
  var opts = {
    speciesNumber: parseInt(req.body.speciesNumber)
    ,formIdentifier: req.body.formIdentifier
    ,gender: parseInt(req.body.gender)
    ,level: parseInt(req.body.level)
    ,isEgg: Boolean(req.body.isEgg)
  };

  if (_.isBoolean(req.body.isShiny)) {
    opts.isShiny = req.body.isShiny;
  }

  if (req.body.holdItemId) {
    opts.holdItemId = req.body.holdItemId;
  }

  Trainer.findByName(req.body.trainer, function(err, trainer){
    if (err) return res.json(500, {error: err.message});
    if (!trainer) return res.json(404, {error: 'TRAINER_NOT_FOUND'});

    async.series({
      pokemon: Pokemon.createPokemon.bind(Pokemon, opts)
      ,pokeBall: async.apply(Item, req.body.pokeBall || 'poke-ball')
      ,location: async.apply(Location, req.body.location || 'pokemon-event')
    }, function(err, ret){
      if (err) return res.json(500, { error: err.message });
      trainer.catchPokemon(ret.pokemon, ret.pokeBall, ret.location, function(err){
        if (err) return res.json(500, { error: err.message });
        res.json(ret.pokemon);
      });
    });
  });
};