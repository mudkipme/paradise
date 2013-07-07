/**
 * Pokémon RESTful Controller
 * @module controllers/pokemon
 */

// dependencies
var _ = require('underscore');
var Item = require('../models/item');

var partyNum = function(req) {
  var party = _.filter(req.trainer.party, function(pokemon){
      return !pokemon.isEgg && !pokemon.pokemonCenter
        && !pokemon._id.equals(req.pokemon._id);
  });
  return party.length;
};

// Get Pokémon information
exports.get = function(req, res) {
  res.json(req.pokemon);
};

// Release a Pokémon
exports.release = function(req, res) {
  if (req.pokemon.isEgg)
    return res.json(403, { error: 'CANNOT_RELEASE_EGG' });
  if (req.pokemon.pokemonCenter)
    return res.json(403, { error: 'CANNOT_RELEASE_PC' });

  var pos = req.trainer.findPokémon(req.pokemon);
  if (!pos) return res.json(500, { error: 'FIND_POKEMON_ERROR' });

  if (pos.party) {
    if (!partyNum(req)) return res.json(403, { error: 'ONE_POKEMON_LEFT' });
    req.trainer.party.splice(pos.position, 1);
  } else {
    req.trainer.storage[pos.boxId].pokemon[pos.position] = null;
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
exports.deposit = function(req, res) {
  if (req.pokemon.pokemonCenter)
    return res.json(403, { error: 'CANNOT_DEPOSIT_PC' });

  var pos = req.trainer.findPokémon(req.pokemon);
  var storage = req.trainer.storageSlot();

  if (!pos) return res.json(500, { error: 'FIND_POKEMON_ERROR' });
  if (!pos.party) return res.json(403, { error: 'POKEMON_NOT_IN_PARTY' });
  if (!storage) return res.json(403, { error: 'ERR_NO_STORAGE_SLOT' });
  if (!partyNum(req)) return res.json(403, { error: 'ONE_POKEMON_LEFT' });

  req.trainer.party.splice(pos.position, 1);
  req.trainer.storage[storage.boxId].pokemon[storage.position] = req.pokemon;

  req.trainer.save(function(err){
    if (err) return res.json(500, { error: err.message });
    res.json(storage);
  });
};

// Withdraw a Pokémon
exports.withdraw = function(req, res) {
  if (req.trainer.party.length == 6)
    res.json(403, { error: 'ERR_NO_PARTY_SLOT' });

  var pos = req.trainer.findPokemon(req.pokemon);

  if (!pos) return res.json(500, { error: 'FIND_POKEMON_ERROR' });

  req.trainer.party.push(req.pokemon);
  req.trainer.storage[pos.boxId].pokemon[pos.position] = null;
  req.trainer.save(function(err){
    if (err) return res.json(500, { error: err.message });
    res.send(204);
  });
};

// Set a nickname to a Pokémon
exports.nickname = function(req, res) {
  if (!req.body.nickname)
    return res.json(400, { error: 'ILLEGAL_REQUEST_DATA' });
  req.pokemon.nickname = req.body.nickname.substr(0, 12);
  req.pokemon.save(function(err){
    if (err) return res.json(500, { error: err.message });
    res.send(req.pokemon.nickname);
  });
};

// Set whether this Pokémon is tradable
exports.tradable = function(req, res) {
  var tradable = req.body.tradable;
  if (tradable === true || tradable == 'true') {
    req.pokemon.tradable = true;
  }
  if (acceptBattle === false || acceptBattle == 'false') {
    req.pokemon.tradable = false;
  }
  req.pokemon.save(function(err){
    if (err) return res.json(500, { error: err.message });
    res.json(req.pokemon.tradable);
  });
};

// Hold an item
exports.holdItem = function(req, res) {
  Item(req.body.itemId, function(err, item){
    if (err) return res.json(500, { error: err.message });

    if (!req.trainer.hasItem(item))
      return res.json(403, { error: 'NO_ITEM_IN_BAG' });

    req.pokemon.setHoldItem(item, function(err){
      if (err) return res.json(500, { error: err.message });

      req.trainer.removeItem(item, 1, function(err){
        if (err) return res.json(500, { error: err.message });
        res.json(req.pokemon.holdItem);
      });
    });
  });
};

// Take a hold item
exports.takeHoldItem = function(req, res) {
  if (!req.pokemon.holdItem)
    return res.json(403, { error: 'NO_HOLD_ITEM' });

  req.trainer.addItem(req.pokemon.holdItem, 1, function(err){
    if (err) return res.json(500, { error: err.message });
    req.pokemon.setHoldItem(null, function(err){
      if (err) return res.json(500, { error: err.message });
      res.send(204);
    });
  });
};