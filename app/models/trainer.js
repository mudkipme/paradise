var mongoose = require('mongoose'),
  async = require('async'),
  BitArray = require('bit-array'),
  _ = require('underscore'),
  Geode = require('geode'),
  Schema = mongoose.Schema,
  config = require('../../config.json'),
  Species = require('./species'),
  Pokemon = require('./pokemon');

var geode = new Geode(config.thirdParty.geonames, {});

// Pokémon Storage System
var StorageSchema = new Schema({
  name:    String,
  pokemon: [{ type: Schema.Types.ObjectId, ref: 'Pokemon' }]
});

/**
 * Init Pokémon data in this storage
 */
StorageSchema.methods.initStorage = function(callback) {
  Pokemon.initCollection(this.pokemon, callback);
};

var TrainerSchema = new Schema({
  name:             String,
  trainerId:        Number,
  pokedexCaughtHex: String,
  pokedexSeenHex:   String,
  pokedexCaughtNum: { type: Number, default: 0 },
  pokedexSeenNum:   { type: Number, default: 0 },
  party:            [{ type: Schema.Types.ObjectId, ref: 'Pokemon' }],
  storage:          [ StorageSchema ],
  currentStorage:   { type: Number, default: 0 },
  maxStorage:       { type: Number, default: 8 },
  bag: [{
    itemId:         Number,
    number:         Number
  }],
  currentLocation:  String,
  wildPokemon:      { type: Schema.Types.ObjectId, ref: 'Pokemon' },
  realWorld: {  
    longitude:      Number,
    latitude:       Number,
    countryCode:    String,
    timezoneId:     { type: String, default: config.app.defaultTimezone }
  },
  language:         { type: String, default: config.app.defaultLanguage },
  acceptBattle:     { type: Boolean, default: config.app.acceptBattle },
  battleTime:       { type: Number, default: 0 },
  battleWin:        { type: Number, default: 0 },
  tradeTime:        { type: Number, default: 0 },
  lastLogin:        Date,
  todayLuck:        Number,
  battlePoint:      { type: Number, default: 0 }
}, {
  toJSON: { virtuals: true }
});

TrainerSchema.methods.setPokedexSeen = function(speciesNumber) {
  if (!this._pokedexSeen) {
    this._pokedexSeen = new BitArray(Species.max, this.pokedexSeenHex);
  }
  this._pokedexSeen.set(speciesNumber, true);
  this.pokedexSeenHex = this._pokedexSeen.toHexString();
  this.pokedexSeenNum = this._pokedexSeen.count();
};

TrainerSchema.methods.setPokedexCaught = function(speciesNumber) {
  if (!this._pokedexCaught) {
    this._pokedexCaught = new BitArray(Species.max, this.pokedexCaughtHex);
  }
  this._pokedexCaught.set(speciesNumber, true);
  this.pokedexCaughtHex = this._pokedexCaught.toHexString();
  this.pokedexCaughtNum = this._pokedexCaught.count();
};

TrainerSchema.methods.getPokedex = function(callback) {
  var me = this;
  if (!me._pokedexSeen) {
    me._pokedexSeen = new BitArray(Species.max, me.pokedexSeenHex);
  }
  if (!me._pokedexCaught) {
    me._pokedexCaught = new BitArray(Species.max, me.pokedexCaughtHex);
  }
  Species.allNames(function(err, result){
    if (err) return callback(err);
    _.each(result, function(dex){
      dex.seen = me._pokedexSeen.get(dex.number);
      dex.caught = me._pokedexCaught.get(dex.number);
    });
    callback(null, result);
  });
};

/**
 * Find an empty slot in storage
 */
TrainerSchema.methods.storageSlot = function() {
  var me = this, boxId = -1, position = -1;

  for (var i = me.currentStorage; i < me.currentStorage + me.maxStorage; i++) {
    if (!me.storage[i % me.maxStorage]) {
      me.storage.set(i % me.maxStorage, { name: '', pokemon: [] });
    }
    var pokemon = me.storage[i % me.maxStorage].pokemon;
    for (var index = 0; index < 30; index++) {
      if (!pokemon[index]) {
        position = index;
        break;
      }
    }

    if (position != -1) {
      boxId = i % me.maxStorage;
      break;
    }
  }

  if (boxId == -1 || position == -1) return null;

  me.currentStorage = boxId;
  return {
    boxId: boxId,
    position: position
  };
};

/**
 * See a Pokémon
 * @param  {Pokemon}  pokemon  The Pokémon to be seen
 */
TrainerSchema.methods.seePokemon = function(pokemon, callback) {
  this.setPokedexSeen(pokemon.speciesNumber);
  this.save(callback);
};

/**
 * Catch a Pokémon
 * @param  {Pokemon}   pokemon  The Pokémon to be caught
 * @param  {Item}      pokeBall The Poké Ball to use
 * @param  {Location}  location The location where the Pokémon was encountered
 */
TrainerSchema.methods.catchPokemon = function(pokemon, pokeBall, location, callback) {
  var me = this, slot = { party: true };

  if (!pokemon || !pokeBall || !location) {
    return callback(new Error('ERR_INVALID_PARAM'));
  }

  if (me.party.length < 6) {
    me.party.push(pokemon);
  } else {
    slot = me.storageSlot();
    if (!slot) return callback(new Error('ERR_NO_STORAGE_SLOT'));

    me.storage[slot.boxId].pokemon.set(slot.position, pokemon);
  }

  pokemon.initData(function(err, pokemon){
    if (err) return callback(err);
    pokemon.trainer = me;
    pokemon.happiness = pokemon.species.baseHappiness;
    pokemon.pokeBallId = pokeBall.id;
    if (!pokemon.originalTrainer) {
      pokemon.originalTrainer = me;
    }
    pokemon.meetDate = new Date();
    pokemon.meetLevel = pokemon.level;
    pokemon.meetPlaceIndex = location.name;


    pokemon.save(function(err){
      if (err) return callback(err);

      me.setPokedexSeen(pokemon.speciesNumber);
      me.setPokedexCaught(pokemon.speciesNumber);
      me.save(function(err){
        if (err) return callback(err);
        callback(null, slot);
      });
    });
  });
};

/**
 * Init Pokémon data in party
 */
TrainerSchema.methods.initParty = function(callback) {
  Pokemon.initCollection(this.party, callback);
};


/**
 * Set real world location based on latitude and longitude
 * @param  {Number}   latitude
 * @param  {Number}   longitude
 */
TrainerSchema.methods.setLocation = function(latitude, longitude, callback) {
  var me = this;
  me.realWorld.latitude = latitude;
  me.realWorld.longitude = longitude;
  geode.timezone({ lat: latitude, lng: longitude }, function(err, tz){
    if (err) return callback(err);
    if (tz.status) return callback(new Error(tz.status.message));
    me.realWorld.timezoneId = tz.timezoneId;
    me.realWorld.countryCode = tz.countryCode;
    me.save(callback);
  });
};

/**
 * Get the position of given Pokémon
 * @param  {Pokemon} pokemon
 */
TrainerSchema.methods.findPokémon = function(pokemon) {
  var partyPopulated = this.populated('party');
  var result = null;
  _.each(this.party, function(pm, index){
    var id = partyPopulated ? pm._id : pm;
    if (id.equals(pokemon._id)) {
      result = { party: true, position: index };
      return false;
    }
  });
  if (result) return result;

  _.each(this.storage, function(storage, boxId){
    var storagePopulated = storage.populated('pokemon');
    _.each(storage.pokemon, function(pm, position){
      var id = storagePopulated ? pm._id : pm;
      if (id.equals(pokemon._id)) {
        result = { boxId: boxId, position: position };
        return false;
      }
    });
  });

  return result;
};

/**
 * Check whether this trainer has certain item in bag
 * @param  {Item} item
 * @param  {Number} number
 */
TrainerSchema.methods.hasItem = function(item, number) {
  if (!_.isObject(item)) return false;
  number = number || 1;

  var itemBag = _.find(this.bag, function(bag){
    return bag.itemId == item.id;
  });

  if (itemBag && itemBag.number >= number)
    return true;
  else
    return false;
};

/**
 * Add an item to bag
 * @param  {Item}   item
 * @param  {Number}   number
 */
TrainerSchema.methods.addItem = function(item, number, callback) {
  if (!_.isObject(item)) return false;

  var itemBag = _.find(this.bag, function(bag){
    return bag.itemId == item.id;
  });

  if (!itemBag) {
    this.bag.push({ itemId: item.id, number: number });
  } else {
    itemBag.number += number;
  }

  this.save(callback);
};

/**
 * Remove an item from bag
 * @param  {Item}   item
 * @param  {Number}   number
 */
TrainerSchema.methods.removeItem = function(item, number, callback) {
  if (!_.isObject(item)) return callback(new Error('ERR_INVALID_PARAM'));

  var itemBag = _.find(this.bag, function(bag){
    return bag.itemId == item.id;
  });

  if (!itemBag || itemBag.number < number)
    return callback(new Error('NO_ENOUGH_ITEM_IN_BAG'));

  itemBag.number -= number;
  this.bag = _.filter(this.bag, function(bag){
    return bag.number > 0;
  });

  this.save(callback);
};

TrainerSchema.index({ name: 1 });

var Trainer = mongoose.model('Trainer', TrainerSchema);
module.exports = Trainer;