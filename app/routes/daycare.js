var router = require('express').Router();
var async = require('async');
var _ = require('underscore');
var DayCare = require('../models/daycare');
var Trainer = require('../models/trainer');
var Item = require('../models/item');
var Msg = require('../models/msg');
var Pokemon = require('../models/pokemon');
var config = require('../../config.json');
var auth = require('../middlewares/authentication');

// middlewares
router.use(auth.login);
router.use(auth.trainer);

// Get one trainer's day care information
router.get('/', function(req, res){
  var getter = function(trainerId, options){
    options = _.extend({ $or: [{trainerA: trainerId}, {trainerB: trainerId}, {eggTrainer: trainerId}] }, options);
    DayCare.find(options)
    .sort('createTime')
    .exec(function(err, dayCares){
      if (err) return res.json(500, {error: err.message});
      async.eachSeries(dayCares, function(dayCare, next){
        dayCare.initData(next);
      }, function(err){
        if (err) return res.json(500, {error: err.message});
        res.json(dayCares);
      });
    });
  };

  if (req.trainer && (!req.query.trainer || req.query.trainer == req.trainer.name))
      return getter(req.trainer._id);

  Trainer.findOne({ name: req.query.trainer })
  .exec(function(err, trainer){
    if (err) return res.json(500, {error: err.message});
    if (!trainer) return res.json(404, {error: 'TRAINER_NOT_FOUND'});
    getter(trainer._id, {$and: [
      {$or: [{pokemonB: null}, {pokemonB: {$exists: false}}]}
      ,{$or: [{egg: null}, {egg: {$exists: false}}]}
    ]}, {pokemonB: null});
  });
});

// Get one day care information
router.get('/:id', function(req, res){
  DayCare.findOne({ _id: req.params.id }, function(err, dayCare){
    if (err) return res.json(500, {error: err.message});
    if (!dayCare) return res.json(404, {error: 'DAY_CARE_NOT_FOUND'});

    dayCare.initData(function(err){
      if (err) return res.json(500, {error: err.message});
      res.json(dayCare);
    });
  });
});

// Create a new day care
router.post('/', function(req, res){
  var pokemon = _.find(req.trainer.party, function(pokemon){
    return pokemon._id.equals(req.body.pokemonA || req.body.pokemonId);
  });
  if (!pokemon) return res.json(404, {error: 'POKEMON_NOT_IN_PARTY'});
  if (!req.trainer.available(pokemon))
    return res.json(403, { error: 'ONE_POKEMON_LEFT' });

  var dayCare = null;

  async.waterfall([
    DayCare.count.bind(DayCare,
      { $or: [{trainerA: req.trainer._id}, {trainerB: req.trainer._id}] })

    ,function(count, next){
      if (count > config.app.maxDayCare)
        return next(new Error('NO_MORE_DAY_CARE'));
      DayCare.newDayCare(pokemon, next);
    }

    ,function(result, next){
      dayCare = result;
      req.trainer.party.pull(pokemon);
      req.trainer.save(next);
    }
  ], function(err){
    if (err) return res.json(403, {error: err.message});
    res.json(dayCare);
  });
});

// Deposit one Pokémon into an existing day care
router.post('/:id/deposit', function(req, res){
  var pokemon = _.find(req.trainer.party, function(pokemon){
    return pokemon._id.equals(req.body.pokemonId);
  });
  if (!pokemon) return res.json(404, {error: 'POKEMON_NOT_IN_PARTY'});

  DayCare.findOne({ _id: req.params.id }, function(err, dayCare){
    if (err) return res.json(500, {error: err.message});
    if (dayCare.trainerA && !dayCare.trainerA.equals(req.trainer._id))
      return res.json(403, {error: 'PERMISSION_DENIED'});

    dayCare.deposit(req.trainer, pokemon, function(err){
      if (err) return res.json(403, {error: err.message});
      res.json(dayCare);
    });
  });
});

// Request to join a day care
router.post('/:id/request', function(req, res){
  var pokemon = _.find(req.trainer.party, function(pokemon){
    return pokemon._id.equals(req.body.pokemonId);
  });
  if (!pokemon) return res.json(404, {error: 'POKEMON_NOT_IN_PARTY'});
  if (pokemon.isEgg) return res.json(403, {error: 'ERR_POKEMON_IS_EGG'});
  if (pokemon.pokemonCenterTime) res.json(403, {error: 'POKEMON_IN_PC'});

  DayCare.findOne({ _id: req.params.id }, function(err, dayCare){
    if (err) return res.json(500, {error: err.message});
    if (dayCare.pokemonB) res.json(403, {error: 'DAY_CARE_FULL'});
    if (dayCare.egg) res.json(403, {error: 'TAKE_EGG_FIRST'});
    if (!dayCare.trainerA) res.json(403, {error: 'DAY_CARE_EMPTY'});

    msg.sendMsg({
      type: 'day-care'
      ,sender: req.trainer
      ,receiver: dayCare.trainerA
      ,content: req.body.content || ''
      ,senderPokemon: pokemon
      ,relatedDayCare: dayCare
    }, function(err, msg){
      if (err) return res.json(500, {error: err.message});
      res.json(msg);
    });
  });
});

// Withdraw a Pokémon from an existing day care
router.post('/:id/withdraw', function(req, res){
  if (req.trainer.party.length == 6)
    return res.json(403, { error: 'ERR_NO_PARTY_SLOT' });

  Pokemon.findById(req.body.pokemonId, function(err, pokemon){
    if (err) return res.json(500, { error: err.message });
    if (!pokemon) return res.json(404, { error: 'POKEMON_NOT_FOUND' });

    if (!pokemon.isEgg && (!pokemon.trainer || !pokemon.trainer._id.equals(req.trainer._id)))
      return res.json(403, { error: 'PERMISSION_DENIED' });

    if (pokemon.isEgg && !pokemon.originalTrainer.equals(req.trainer))
      return res.json(403, { error: 'PERMISSION_DENIED' });

    DayCare.findOne({ _id: req.params.id }, function(err, dayCare){
      async.series([
        dayCare.initData.bind(dayCare)
        ,dayCare.withdraw.bind(dayCare, pokemon)
        ,function(next){
          if (pokemon.isEgg) {
            Item('poke-ball', function(err, pokeBall){
              if (err) return next(err);
              req.trainer.catchPokemon(pokemon, pokeBall, 'day-care', next);
            });
          } else {
            req.trainer.party.push(pokemon);
            req.trainer.save(next);
          }
        }
      ], function(err){
        if (err) return res.json(403, {error: err.message});
        if (dayCare.removed) return res.send(204);
        res.json(dayCare);
      });
    });
  });
});

module.exports = router;