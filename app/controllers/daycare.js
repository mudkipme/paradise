var async = require('async');
var _ = require('underscore');
var DayCare = require('../models/daycare');
var Trainer = require('../models/trainer');
var Item = require('../models/item');
var Msg = require('../models/msg');
var pm = require('../middlewares/pokemon-middleware');
var config = require('../../config.json');

// Get one trainer's day care information
exports.list = function(req, res){
  var getter = function(trainerId){
    DayCare.find({ $or: [{trainerA: trainerId}, {trainerB: trainerId}, {eggTrainer: trainerId}] })
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

  if (req.trainer && (!req.query.trainer
    || req.query.trainer == req.trainer.name))
      return getter(req.trainer._id);

  Trainer.findOne({ name: req.query.trainer })
  .exec(function(err, trainer){
    if (err) return res.json(500, {error: err.message});
    if (!trainer) return res.json(404, {error: 'TRAINER_NOT_FOUND'});
    getter(trainer._id);
  });
};

// Get one day care information
exports.get = function(req, res){
  DayCare.findOne({ _id: req.params.dayCareId }, function(err, dayCare){
    if (err) return res.json(500, {error: err.message});
    if (!dayCare) return res.json(404, {error: 'DAY_CARE_NOT_FOUND'});

    dayCare.initData(function(err){
      if (err) return res.json(500, {error: err.message});
      res.json(dayCare);
    });
  });
};

// Create a new day care
exports.post = function(req, res){
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
};

// Deposit one Pokémon into an existing day care
exports.deposit = function(req, res){
  var pokemon = _.find(req.trainer.party, function(pokemon){
    return pokemon._id.equals(req.body.pokemonId);
  });
  if (!pokemon) return res.json(404, {error: 'POKEMON_NOT_IN_PARTY'});
  if (!req.trainer.available(pokemon))
    return res.json(403, { error: 'ONE_POKEMON_LEFT' });

  DayCare.findOne({ _id: req.params.dayCareId }, function(err, dayCare){
    if (err) return res.json(500, {error: err.message});
    if (dayCare.trainerA && !dayCare.trainerA.equals(req.trainer._id))
      return res.json(403, {error: 'PERMISSION_DENIED'});

    async.series([
      dayCare.deposit.bind(dayCare, pokemon)
      ,function(next){
        req.trainer.party.pull(pokemon);
        req.trainer.save(next);
      }
    ], function(err){
      if (err) return res.json(403, {error: err.message});
      res.json(dayCare);
    });
  });
};

// Request to join a day care
exports.request = function(req, res){
  var pokemon = _.find(req.trainer.party, function(pokemon){
    return pokemon._id.equals(req.body.pokemonId);
  });
  if (!pokemon) return res.json(404, {error: 'POKEMON_NOT_IN_PARTY'});
  if (pokemon.isEgg) return res.json(403, {error: 'ERR_POKEMON_IS_EGG'});
  if (pokemon.pokemonCenterTime) res.json(403, {error: 'POKEMON_IN_PC'});

  DayCare.findOne({ _id: req.params.dayCareId }, function(err, dayCare){
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
};

// Withdraw a Pokémon from an existing day care
exports.withdraw = function(req, res){
  if (req.trainer.party.length == 6)
    return res.json(403, { error: 'ERR_NO_PARTY_SLOT' });

  pm.pokemon(req, res, function(){
    if (!req.pokemon.isEgg && (!req.pokemon.trainer || !req.pokemon.trainer._id.equals(req.trainer._id)))
      return res.json(403, { error: 'PERMISSION_DENIED' });

    if (req.pokemon.isEgg && !req.pokemon.originalTrainer.equals(req.trainer))
      return res.json(403, { error: 'PERMISSION_DENIED' });

    DayCare.findOne({ _id: req.params.dayCareId }, function(err, dayCare){
      async.series([
        dayCare.initData.bind(dayCare)
        ,dayCare.withdraw.bind(dayCare, req.pokemon)
        ,function(next){
          if (req.pokemon.isEgg) {
            Item('poke-ball', function(err, pokeBall){
              if (err) return next(err);
              req.trainer.catchPokemon(req.pokemon, pokeBall, 'day-care', next);
            });
          } else {
            req.trainer.party.push(req.pokemon);
            req.trainer.save(next);
          }
        }
      ], function(err){
        if (err) return res.json(403, {error: err.message});
        if (dayCare.removed) return res.send(204);
        res.json(dayCare);
      });
    });

  }, req.body.pokemonId);
};
