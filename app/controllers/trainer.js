/**
 * Trainer RESTful Controller
 * @module controllers/trainer
 */

// dependencies
var async = require('async');
var _ = require('underscore');
var io = require('../io');
var Trainer = require('../models/trainer');
var Pokemon = require('../models/pokemon');
var Item = require('../models/item');

// Get trainer's information
exports.get = function(req, res){
  if (req.trainer && (!req.params.name || req.params.name == req.trainer.name))
    return res.json(req.trainer);

  Trainer.findByName(req.params.name, function(err, trainer){
    if (err) return res.json(500, { error: err.message });
    if (!trainer) return res.json(404, { error: 'TRAINER_NOT_FOUND' });

    res.json(trainer);
  });
};

// Get trainer's Pokédex
exports.pokedex = function(req, res){
  Trainer.findOne({ name: req.params.name })
  .exec(function(err, trainer) {
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
exports.post = function(req, res){
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
      res.json(trainer);
    });
  });
};

// Get one's Pokémon list
exports.pokemon = function(req, res){
  var skip = req.query.skip || 0;
  var limit = req.query.limit || 100;
  if (limit > 100) {
    limit == 100;
  }

  Trainer.findOne({ name: req.params.name })
  .exec(function(err, trainer){
    if (err) return res.json(500, { error: err.message });
    if (!trainer) return res.json(404, { error: 'TRAINER_NOT_FOUND' });

    var condition = { trainer: trainer };
    if (req.query.tradable == 'yes') {
      condition.tradable = true;
    }

    Pokemon.find(condition)
    .skip(skip).limit(limit)
    .exec(function(err, pokemon){
      Pokemon.initCollection(pokemon, function(err){
        if (err) return res.json(500, { error: err.message });
        res.json(pokemon);
      });
    })
  });
};

// Get my bag
exports.bag = function(req, res){
  async.mapSeries(_.pluck(req.trainer.bag, 'itemId'), Item, function(err, result){
    if (err) return res.json(500, { error: err.message });

    res.json(_.map(result, function(item, index){
      return {
        id: item.id
        ,item: item
        ,number: req.trainer.bag[index].number
      };
    }));
  });
};

// Set whether accept battle
exports.acceptBattle = function(req, res){
  var acceptBattle = req.body.acceptBattle;
  if (acceptBattle === true || acceptBattle == 'true') {
    req.trainer.acceptBattle = true;
  }
  if (acceptBattle === false || acceptBattle == 'false') {
    req.trainer.acceptBattle = false;
  }
  req.trainer.save(function(err){
    if (err) return res.json(500, { error: err.message });
    res.json(req.trainer.acceptBattle);
  });
};

// Set the real world information
exports.realWorld = function(req, res){
  if (!req.body.latitude || !req.body.longitude)
    return res.json(400, { error: 'ILLEGAL_REQUEST_DATA' });

  req.trainer.setLocation(req.body.latitude, req.body.longitude, function(err){
    if (err) return res.json(500, { error: err.message });
    res.json(req.trainer.realWorld);
  });
};

// Move Pokémon in party
exports.move = function(req, res){
  var origin = _.map(req.trainer.party, function(pokemon){
    return pokemon._id.toString();
  });
  if (_.difference(origin, req.body.order).length > 0)
    return res.json(400, { error: 'ILLEGAL_REQUEST_DATA' });

  req.trainer.party = req.body.order;
  req.trainer.save(function(err){
    if (err) return res.json(500, { error: err.message });
    res.send(204);
    io.emit(req, 'party:move', req.body.order);
  });
};