var router = require('express').Router();
var _ = require('underscore');
var async = require('async');
var Species = require('../models/species');
var Pokemon = require('../models/pokemon');
var Trainer = require('../models/trainer');
var Item = require('../models/item');
var Location = require('../models/location');
var Nature = require('../models/nature');
var Msg = require('../models/msg');
var config = require('../../config.json');
var auth = require('../middlewares/authentication');
var io = require('../io');

// Middlewares
router.use(auth.login);
router.use(auth.trainer);
router.use(function(req, res, next){
  if (!req.member.isAdmin) return res.json(403, { error: 'PERMISSION_DENIED' });
  next();
});

// List basic information of 52Poké Paradise
router.get('/info', function(req, res){
  async.series({
    forms: Species.allForms.bind(Species)
    ,trainerCount: Trainer.count.bind(Trainer)
    ,pokemonCount: Pokemon.count.bind(Pokemon, {trainer: {'$exists': true, '$ne': null}})
    ,natures: Nature.allNatures.bind(Nature)
    ,items: Item.getItemNames.bind(Item, config.admin.availableItems)
    ,pokeBalls: Item.getItemNames.bind(Item, config.admin.availablePokeBalls)
  }, function(err, results){
    if (err) return res.json(500, {error: err.message});
    var forms = [];
    _.each(results.forms, function(species, speciesNumber){
      forms.push({
        speciesNumber: speciesNumber
        ,name: species.name
        ,forms: _.values(species.forms)
      });
    });
    results.forms = forms;
    results.onlineCount = _.size(io.sio.rooms);
    results.onlineCount && (results.onlineCount -= 1);
    res.json(results);
  });
});

// Send event Pokémon to trainers
router.post('/event-pokemon', function(req, res){
  var opts = {
    speciesNumber: parseInt(req.body.speciesNumber)
    ,formIdentifier: req.body.formIdentifier
    ,gender: parseInt(req.body.gender)
    ,level: parseInt(req.body.level)
    ,isEgg: Boolean(req.body.isEgg)
    ,isShiny: Boolean(req.body.isShiny)
    ,natureId: parseInt(req.body.natureId)
    ,holdItemId: parseInt(req.body.holdItemId)
  };

  isNaN(req.body.holdItemId) || (opts.holdItemId = parseInt(req.body.holdItemId));
  _.isBoolean(req.body.isShiny) && (opts.isShiny = req.body.isShiny);
  _.isObject(req.body.individual) && (opts.individual = req.body.individual);

  if (req.body.originalTrainer) {
    opts.originalTrainer = config.admin.defaultOT;
    opts.displayOT = req.body.originalTrainer;
  }

  if (!_.isArray(req.body.trainer))
    return res.json(400, {error: 'ERR_INVALID_PARAM'});

  async.mapSeries(req.body.trainer, function(trainer, next){

    async.series({
      trainer: Trainer.findByName.bind(Trainer, trainer)
      ,pokemon: Pokemon.createPokemon.bind(Pokemon, opts)
      ,pokeBall: async.apply(Item, parseInt(req.body.pokeBall) || 'poke-ball')
      ,location: async.apply(Location, req.body.location || 'pokemon-event')
    }, function(err, ret){
      if (err) return next(err);
      if (!ret.trainer) return next(null, null);
      if (_.isString(req.body.nickname)) {
        ret.pokemon.nickname = req.body.nickname.substr(0, 12);
      }

      ret.trainer.catchPokemon(ret.pokemon, ret.pokeBall, ret.location, function(err){
        if (err) return next(err);

        Msg.sendMsg({
          type: 'event-pokemon'
          ,sender: config.admin.defaultOT
          ,receiver: ret.trainer
          ,receiverPokemon: ret.pokemon
          ,content: req.body.message
        }, function(err){
          if (err) return next(err);
          next(null, {pokemon: ret.pokemon, trainer: ret.trainer});
          ret.trainer.log('event-pokemon', {pokemon: ret.pokemon, relatedTrainer: req.trainer});
        });
      });
    });

  }, function(err, results){
    if (err) return res.json(500, { error: err.message });
    res.json(results);
  });
});

// Send event items to trainers
router.post('/event-item', function(req, res){
  if (!_.isArray(req.body.trainer))
    return res.json(400, {error: 'ERR_INVALID_PARAM'});

  var itemId = parseInt(req.body.itemId), number = parseInt(req.body.number);

  async.mapSeries(req.body.trainer, function(trainer, next){

    Trainer.findByName(trainer, function(err, trainer){
      if (err) return next(err);
      if (!trainer) return next(null, null);

      async.series([
        async.apply(Item, itemId)
        ,trainer.addItem.bind(trainer, itemId, number)
        ,Msg.sendMsg.bind(Msg, {
          type: 'gift-item'
          ,sender: config.admin.defaultOT
          ,receiver: trainer
          ,relatedItemId: itemId
          ,relatedNumber: number
          ,content: req.body.message
        })
      ], function(err, results){
        if (err) return next(err);
        next(null, {item: results[0], trainer: trainer, number: number});
        trainer.log('event-item', {itemId: itemId, number: number, relatedTrainer: req.trainer});
      });
    });

  }, function(err, results){
    if (err) return res.json(500, { error: err.message });
    res.json(results);
  });
});

// Send messages to trainers
router.post('/api/admin/send-msg', function(req, res){
  var condition = {name: {'$in': req.body.trainer}};
  req.body.allTrainer && (condition = {});
  if (req.body.onlineTrainer) {
    var onlines = _.map(_.compact(_.keys(io.sio.rooms)), function(id){
      return id.substr(1);
    });
    condition = {_id: {'$in': onlines}};
  };

  Trainer.find(condition, function(err, trainers){
    if (err) return res.json(500, { error: err.message });

    async.mapSeries(trainers, function(trainer, next){
      Msg.sendMsg({
        type: 'message'
        ,sender: config.admin.defaultOT
        ,receiver: trainer
        ,content: req.body.message
      }, next);
    }, function(err, results){
      if (err) return res.json(500, { error: err.message });
      res.json(results);
    });
  });
});

router.get('/all-trainer', function(req, res){
  var fields = (req.query.pick || 'name,id').split(',');

  Trainer.find({}, fields.join(' '), function(err, trainers){
    if (err) return res.json(500, { error: err.message });
    res.json(_.map(trainers, function(trainer){
      return _.pick(trainer, fields);
    }));
  });
});

module.exports = router;