/**
 * Pokémon RESTful Controller
 * @module controllers/pokemon
 */

// dependencies
var router = require('express').Router();
var async = require('async');
var _ = require('underscore');
var io = require('../io');
var Item = require('../models/item');
var Pokemon = require('../models/pokemon');
var auth = require('../middlewares/authentication');

router.param('id', function(req, res, next, id){
  Pokemon.findById(id, function(err, pokemon){
    if (err) return res.json(500, { error: err.message });
    if (!pokemon) return res.json(404, { error: 'POKEMON_NOT_FOUND' });

    req.pokemon = pokemon;
    next();
  });
});

// Get Pokémon information
router.get('/:id', function(req, res){
  res.json(req.pokemon);
});

// middlewares
router.use(auth.login);
router.use(auth.trainer);

// Must be my Pokémon
var mine = function(req, res, next){
  if (!req.pokemon.trainer || !req.pokemon.trainer._id.equals(req.trainer._id))
    return res.json(403, { error: 'PERMISSION_DENIED' });
  next();
};

// Release a Pokémon
router.post('/:id/release', mine, function(req, res){
  if (req.pokemon.isEgg)
    return res.json(403, { error: 'CANNOT_RELEASE_EGG' });
  if (req.pokemon.pokemonCenter)
    return res.json(403, { error: 'CANNOT_RELEASE_PC' });

  var pos = req.trainer.findPokemon(req.pokemon);
  if (!pos) return res.json(500, { error: 'FIND_POKEMON_ERROR' });

  if (pos.party) {
    if (!req.trainer.available(req.pokemon))
      return res.json(403, { error: 'ONE_POKEMON_LEFT' });
    req.trainer.party.splice(pos.position, 1);
  } else {
    req.trainer.storagePokemon.pull(pos._id);
  }

  req.pokemon.trainer = null;
  req.trainer.save(function(err){
    if (err) return res.json(500, { error: err.message });
    req.pokemon.save(function(err){
      if (err) return res.json(500, { error: err.message });
      res.send(204);
    });
  });
});

// Deposit a Pokémon
router.post('/:id/deposit', mine, function(req, res){
  if (req.pokemon.pokemonCenter)
    return res.json(403, { error: 'CANNOT_DEPOSIT_PC' });

  var pos = req.trainer.findPokemon(req.pokemon);
  var storage = req.trainer.storageSlot();

  if (!pos) return res.json(500, { error: 'FIND_POKEMON_ERROR' });
  if (!pos.party) return res.json(403, { error: 'POKEMON_NOT_IN_PARTY' });
  if (!req.trainer.available(req.pokemon))
      return res.json(403, { error: 'ONE_POKEMON_LEFT' });

  req.trainer.party.splice(pos.position, 1);
  req.trainer.storagePokemon.push(_.extend({ pokemon: req.pokemon }, storage));
  req.trainer.save(function(err){
    if (err) return res.json(500, { error: err.message });
    res.send(204);

    // Send storage add events to all clients
    io.sockets.in(req.trainer.id).emit('storage:add'
      , _.extend(req.pokemon.toJSON(), storage));
    // Send party remove events to all other clients
    io.emit(req, 'party:remove', req.pokemon.id);
  });
});

// Withdraw a Pokémon
router.post('/:id/withdraw', mine, function(req, res){
  if (req.trainer.party.length == 6)
    return res.json(403, { error: 'ERR_NO_PARTY_SLOT' });

  var pos = req.trainer.findPokemon(req.pokemon);

  if (!pos) return res.json(500, { error: 'FIND_POKEMON_ERROR' });
  if (pos.party) return res.json(403, { error: 'ALREADY_IN_PARTY' });

  req.trainer.party.push(req.pokemon);
  req.trainer.storagePokemon.pull(pos._id);
  req.trainer.save(function(err){
    if (err) return res.json(500, { error: err.message });
    res.send(204);

    // Send storage add events to all clients
    io.sockets.in(req.trainer.id).emit('party:add', req.pokemon);
    // Send party remove events to all other clients
    io.emit(req, 'storage:remove', pos);
  });
});

// Set nickname or tradable status
var setInformation = function(req, res){
  if (_.isString(req.body.nickname) && req.pokemon.originalTrainer
    && req.trainer.equals(req.pokemon.originalTrainer)) {
    req.pokemon.nickname = req.body.nickname.substr(0, 12);
  }
  if (!_.isUndefined(req.body.tradable)) {
    req.pokemon.tradable = Boolean(req.body.tradable);
  }
  req.pokemon.save(function(err){
    if (err) return res.json(500, { error: err.message });
    res.send(req.pokemon);
    io.emit(req, 'pokemon:change', req.pokemon);
  });
};
router.patch('/:id', setInformation);
router.put('/:id', setInformation);

// Hold an item
router.post('/:id/hold-item', mine, function(req, res){
  var itemId = parseInt(req.body.itemId);

  if (!req.trainer.hasItem(itemId))
    return res.json(403, { error: 'NO_ENOUGH_ITEM_IN_BAG' });

  if (req.pokemon.isEgg) return res.json(403, { error: 'ERR_POKEMON_IS_EGG' });
  if (req.pokemon.pokemonCenterTime) return res.json(403, { error: 'POKEMON_IN_PC' });

  Item(req.body.itemId, function(err, item){
    if (err) return res.json(500, { error: err.message });

    var actions = [
      req.pokemon.setHoldItem.bind(req.pokemon, item)
      ,req.trainer.removeItem.bind(req.trainer, item, 1)
    ];

    if (req.pokemon.holdItem) {
      actions.unshift(
        req.trainer.addItem.bind(req.trainer, req.pokemon.holdItem, 1)
      );
    }

    async.series(actions, function(err){
      if (err) return res.json(500, { error: err.message });
      res.json(req.pokemon);
      io.emit(req, 'pokemon:change', req.pokemon);
      req.trainer.log('hold-item', {pokemon: req.pokemon, itemId: itemId});
    });
  });
});

// Take a hold item
router.post('/:id/take-item', mine, function(req, res){
  if (!req.pokemon.holdItem)
    return res.json(403, { error: 'NO_HOLD_ITEM' });

  var itemId = req.pokemon.holdItemId;

  async.series([
    req.trainer.addItem.bind(req.trainer, req.pokemon.holdItem, 1)
    ,req.pokemon.setHoldItem.bind(req.pokemon, null)
  ], function(err){
    if (err) return res.json(500, { error: err.message });
    res.json(req.pokemon);
    io.emit(req, 'pokemon:change', req.pokemon);
    req.trainer.log('take-item', {pokemon: req.pokemon, itemId: itemId});
  });
});

// Send pokemon to Pokémon Center
router.post('/:id/send-pokemon-center', mine, function(req, res){
  var stats = req.pokemon.stats;
  if (stats.maxHp == stats.hp) return res.json(403, { error: 'HP_FULL' });
  if (req.pokemon.pokemonCenter) return res.json(403, { error: 'ALREADY_IN_PC' });

  var position = req.trainer.findPokemon(req.pokemon);
  if (!position.party) return res.json(403, { error: 'POKEMON_NOT_IN_PARTY' });

  req.pokemon.pokemonCenter = new Date();
  req.pokemon.save(function(){
    res.json(req.pokemon);
    io.emit(req, 'pokemon:change', req.pokemon);
  });
});

// Use items
router.post('/:id/use-item', mine, function(req, res){
  var itemId = parseInt(req.body.itemId);

  if (!req.trainer.hasItem(itemId))
    return res.json(403, {error: 'NO_ENOUGH_ITEM_IN_BAG'});

  var before = req.pokemon.toObject({depopulate: true});
  if (!before._id) {
    before = req.pokemon.toObject();
  }

  Item(itemId, function(err, item){
    if (err) return res.json(500, {error: err.message});

    async.series([
      item.use.bind(item, req.pokemon)
      ,req.trainer.removeItem.bind(req.trainer, itemId, 1)
    ], function(err, results){
      if (err) return res.json(403, {error: err.message});

      res.json({
        pokemon: req.pokemon
        ,events: _.compact(_.flatten(results[0]))
      });

      io.emit(req, 'pokemon:change', req.pokemon);
      req.trainer.log('use-item', {before: before, pokemon: req.pokemon, itemId: itemId});
    });
  });
});

module.exports = router;