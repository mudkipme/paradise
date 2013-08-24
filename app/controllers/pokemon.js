/**
 * Pokémon RESTful Controller
 * @module controllers/pokemon
 */

// dependencies
var async = require('async');
var _ = require('underscore');
var io = require('../io');
var Item = require('../models/item');

var partyNum = function(req){
  var party = _.filter(req.trainer.party, function(pokemon){
      return !pokemon.isEgg && !pokemon.pokemonCenter
        && !pokemon._id.equals(req.pokemon._id);
  });
  return party.length;
};

// Get Pokémon information
exports.get = function(req, res){
  res.json(req.pokemon);
};

// Release a Pokémon
exports.release = function(req, res){
  if (req.pokemon.isEgg)
    return res.json(403, { error: 'CANNOT_RELEASE_EGG' });
  if (req.pokemon.pokemonCenter)
    return res.json(403, { error: 'CANNOT_RELEASE_PC' });

  var pos = req.trainer.findPokemon(req.pokemon);
  if (!pos) return res.json(500, { error: 'FIND_POKEMON_ERROR' });

  if (pos.party) {
    if (!partyNum(req)) return res.json(403, { error: 'ONE_POKEMON_LEFT' });
    req.trainer.party.splice(pos.position, 1);
  } else {
    req.trainer.storage[pos.boxId].pokemon.set(pos.position, null);
  }

  req.pokemon.trainer = null;
  req.trainer.save(function(err){
    if (err) return res.json(500, { error: err.message });
    req.pokemon.save(function(err){
      if (err) return res.json(500, { error: err.message });
      res.send(204);
    });
  });
};

// Deposit a Pokémon
exports.deposit = function(req, res){
  if (req.pokemon.pokemonCenter)
    return res.json(403, { error: 'CANNOT_DEPOSIT_PC' });

  var pos = req.trainer.findPokemon(req.pokemon);
  var storage = req.trainer.storageSlot();

  if (!pos) return res.json(500, { error: 'FIND_POKEMON_ERROR' });
  if (!pos.party) return res.json(403, { error: 'POKEMON_NOT_IN_PARTY' });
  if (!partyNum(req)) return res.json(403, { error: 'ONE_POKEMON_LEFT' });

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
};

// Withdraw a Pokémon
exports.withdraw = function(req, res){
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
};

// Set nickname or tradable status
exports.put = function(req, res){
  if (typeof req.body.nickname === 'string') {
    req.pokemon.nickname = req.body.nickname.substr(0, 12);
  }
  if (typeof req.body.tradable !== 'undefined') {
    req.pokemon.tradable = Boolean(req.body.tradable);
  }
  req.pokemon.save(function(err){
    if (err) return res.json(500, { error: err.message });
    res.send(req.pokemon);
    io.emit(req, 'pokemon:change', req.pokemon);
  });
};

// Hold an item
exports.holdItem = function(req, res){
  var itemId = parseInt(req.body.itemId);

  if (!req.trainer.hasItem(itemId))
    return res.json(403, { error: 'NO_ENOUGH_ITEM_IN_BAG' });

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
    });
  });
};

// Take a hold item
exports.takeItem = function(req, res){
  if (!req.pokemon.holdItem)
    return res.json(403, { error: 'NO_HOLD_ITEM' });

  async.series([
    req.trainer.addItem.bind(req.trainer, req.pokemon.holdItem, 1)
    ,req.pokemon.setHoldItem.bind(req.pokemon, null)
  ], function(err){
    if (err) return res.json(500, { error: err.message });
    res.json(req.pokemon);
  });
};

// Send pokemon to Pokémon Center
exports.sendPokemonCenter = function(req, res){
  var stats = req.pokemon.stats;
  if (stats.maxHp == stats.hp) return res.json(403, { error: 'HP_FULL' });
  if (req.pokemon.pokemonCenter) return res.json(403, { error: 'ALREADY_IN_PC' });

  var position = req.trainer.findPokemon(req.pokemon);
  if (!position.party) return res.json(403, { error: 'POKEMON_NOT_IN_PARTY' });

  req.pokemon.pokemonCenter = new Date();
  req.pokemon.save(function(){
    res.json(req.pokemon);
  });
};