var mongoose = require('mongoose'),
  async = require('async'),
  BitArray = require('bit-array'),
  _ = require('underscore'),
  Schema = mongoose.Schema,
  config = require('../../config.json'),
  Species = require('./species');

var StorageSchema = new Schema({
  name:    String,
  pokemon: [{ type: Schema.Types.ObjectId, ref: 'Pokemon' }]
})

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
});

/*
  Get and set the status of Pokédex
  trainer.pokedexCaught, trainer.pokedexSeen
  trainer.setPokedexCaught, trainer.setPokedexSeen
 */
['Caught', 'Seen'].forEach(function(dexType){
  var me = this;
  TrainerSchema.virtual('pokedex' + dexType).get(function(){
    if (!me['_' + dexType]) {
      me['_' + dexType] = new BitArray(Species.max);
    }
    return me['_' + dexType];
  });

  TrainerSchema.methods['setPokedex' + dexType] = function(speciesNumber){
    if (!me['_' + dexType]) {
      me['_' + dexType] = new BitArray(Species.max);
    }
    me['_' + dexType].set(speciesNumber, true);
    me['pokedex' + dexType + 'Hex'] = me['_' + dexType].toHexString();
    me['pokedex' + dexType + 'Num'] = me['_' + dexType].count();
  };
});

/**
 * Find an empty slot in storage
 */
TrainerSchema.methods.storageSlot = function(){
  var me = this, boxId = -1, position = -1;

  for (var i = me.currentStorage; i < me.currentStorage + me.maxStorage; i++) {
    var pokemon = me.storage[i % me.maxStorage].pokemon;
    _.each(pokemon, function(pm, index){
      if (!pm) {
        position = index;
        return false;
      }
    });
    if (position != -1) {
      boxId = i % me.maxStorage;
      break;
    }
  }

  if (boxId == -1 || position == -1) return null;

  return {
    boxId: boxId,
    position: position
  };
};

/**
 * See a Pokémon
 * @param  {Pokemon}  pokemon  The Pokémon to be seen
 */
TrainerSchema.methods.seePokemon = function(pokemon, callback){
  this.setPokedexSeen(pokemon.speciesNumber);
  this.save(callback);
};

/**
 * Catch a Pokémon
 * @param  {Pokemon}   pokemon  The Pokémon to be caught
 * @param  {Item}      pokeBall The Poké Ball to use
 * @param  {Location}  location The location where the Pokémon was encountered
 */
TrainerSchema.methods.catchPokemon = function(pokemon, pokeBall, location, callback){
  var me = this, slot = { party: true };

  if (!pokemon || !pokeBall || !location) {
    return callback(new Error('ERR_INVALID_PARAM'));
  }

  // 队伍中有空位
  if (me.party.length < 6) {
    me.party.push(pokemon);
  } else {
    slot = me.storageSlot();
    if (!slot) {
      callback(new Error('ERR_TRAINER_NO_STORAGE_SLOT'));
    }
    me._storage[slot.boxId] = me._storage[slot.boxId] || {};
    me._storage[slot.boxId][slot.position] = pokemon;
    me.storage.push({
      boxId: slot.boxId,
      position: slot.pokemon,
      pokemon: pokemon
    });
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

var Trainer = mongoose.model('Trainer', TrainerSchema);
module.exports = Trainer;