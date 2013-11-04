var _ = require('underscore');
var async = require('async');
var Pokemon = require('../models/pokemon');
var Trainer = require('../models/trainer');
var Item = require('../models/item');
var Location = require('../models/location');

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

exports.halloween = function(req, res){
  var randomSpecies = [200, 353, 355, 562, 92, 425, 442, 607, 302, 479, 592, 622];
  var randomItem = [302, 287, 224, 50];

  var opts = {
    speciesNumber: _.sample(randomSpecies),
    holdItemId: _.sample(randomItem),
    originalTrainer: '5273d1f14a13ea20b5faf868',
    displayOT: 'Trick-or-Treat'
  };

  Trainer.findByName(req.body.trainer, function(err, trainer){
    if (err) return res.json(500, {error: err.message});
    if (!trainer) return res.json(404, {error: 'TRAINER_NOT_FOUND'});

    async.series({
      pokemon: Pokemon.createPokemon.bind(Pokemon, opts)
      ,pokeBall: async.apply(Item, 'cherish-ball')
      ,location: async.apply(Location, '2013-halloween')
    }, function(err, ret){
      if (err) return res.json(500, { error: err.message });
      trainer.catchPokemon(ret.pokemon, ret.pokeBall, ret.location, function(err){
        if (err) return res.json(500, { error: err.message });
        res.json(ret.pokemon);
      });
    });
  });
};