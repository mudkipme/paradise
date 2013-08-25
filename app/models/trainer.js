var mongoose = require('mongoose');
var async = require('async');
var BitArray = require('bit-array');
var _ = require('underscore');
var Geode = require('geode');
var time = require('time');
var Species = require('./species');
var Pokemon = require('./pokemon');
var config = require('../../config.json');

var Schema = mongoose.Schema;
var geode = new Geode(config.thirdParty.geonames, {});

var TrainerSchema = new Schema({
  name:             String,
  trainerId:        Number,
  pokedexCaughtHex: String,
  pokedexSeenHex:   String,
  pokedexCaughtNum: { type: Number, default: 0 },
  pokedexSeenNum:   { type: Number, default: 0 },
  party:            [{ type: Schema.Types.ObjectId, ref: 'Pokemon' }],
  storage:          [{
    name:           String,
    wallpaper:      String
  }],
  currentBox:       { type: Number, default: 0 },
  storagePokemon:   [{
    boxId:          { type: Number, min: 0 },
    position:       { type: Number, min: 0, max: 29 },
    pokemon:        { type: Schema.Types.ObjectId, ref: 'Pokemon' }
  }],
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
  toJSON: { virtuals: true, minimize: false }
});

TrainerSchema.virtual('luckSpecies').get(function(){
  return this._todaySpecies;
});

TrainerSchema.virtual('storageNum').get(function(){
  if (this.storage) {
    return Math.max(this.storage.length, 8);
  }
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
  var me = this;
  var storageNum = me.storageNum;
  var box = [];

  // the indexes of all boxes from currentBox
  var boxIds = _.map(_.range(me.currentBox, me.currentBox + storageNum)
    ,function(index){ return index % storageNum; });

  // find the box which has empty slot
  var boxId = _.find(boxIds, function(boxId){
    box = _.where(me.storagePokemon, { boxId: boxId });
    return box.length < 30;
  });

  // add a box when there's no empty slot
  if (_.isUndefined(boxId)) {
    boxId = me.storage.length;
    me.storage.push({ name: '', wallpaper: '' });
  }

  // find an empty slot in the box
  var position = _.find(_.range(0, 30), function(pos){
    return _.isUndefined(_.findWhere(box, { position: pos })); 
  });

  me.currentBox = boxId;

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
    me.storagePokemon.push(_.extend({ pokemon: pokemon }, slot));
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
TrainerSchema.methods.initParty = function(callback){
  async.eachSeries(this.party, function(pokemon, next){
    pokemon.initData(next);
  }, callback);
};


/**
 * Set real world location based on latitude and longitude
 * @param  {Number}   latitude
 * @param  {Number}   longitude
 */
TrainerSchema.methods.setLocation = function(latitude, longitude, callback){
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
TrainerSchema.methods.findPokemon = function(pokemon){
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

  result = _.find(this.storagePokemon, function(sp){
    var id = sp.populated('pokemon') ? sp.pokemon._id : sp.pokemon;
    return id.equals(pokemon._id);
  });

  return result;
};

/**
 * Check whether this trainer has certain item in bag
 * @param  {Item} item
 * @param  {Number} number
 */
TrainerSchema.methods.hasItem = function(item, number){
  var id = _.isObject(item) ? item.id : item;
  var itemBag = _.findWhere(this.bag, {itemId: id});
  number = number || 1;

  if (itemBag && itemBag.number >= number)
    return itemBag.number;
  else
    return false;
};

/**
 * Add an item to bag
 * @param  {Item}   item
 * @param  {Number}   number
 */
TrainerSchema.methods.addItem = function(item, number, callback){
  var id = _.isObject(item) ? item.id : item;
  var itemBag = _.findWhere(this.bag, {itemId: id});
  if (number <= 0) { number = 1; }

  if (!itemBag) {
    this.bag.push({ itemId: id, number: number });
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
TrainerSchema.methods.removeItem = function(item, number, callback){
  var id = _.isObject(item) ? item.id : item;
  var itemBag = _.findWhere(this.bag, {itemId: id});
  if (number <= 0) { number = 1; }

  if (!itemBag || itemBag.number < number)
    return callback(new Error('NO_ENOUGH_ITEM_IN_BAG'));

  itemBag.number -= number;
  this.bag = _.filter(this.bag, function(bag){
    return bag.number > 0;
  });

  this.save(callback);
};

// Get today's lucky Pokémon
TrainerSchema.methods.todaySpecies = function(callback){
  var me = this;

  var cb = function(err, species){
    if (err) return callback(err);
    me._todaySpecies = species;
    callback(null, species);
  };

  if (me.lastLogin && me.todayLuck) {
    var lastLogin = new time.Date(me.lastLogin.getTime());
    var now = new time.Date();

    lastLogin.setTimezone(me.realWorld.timezoneId);
    now.setTimezone(me.realWorld.timezoneId);

    if (now.getFullYear() == lastLogin.getFullYear()
      && now.getMonth() == lastLogin.getMonth()
      && now.getDate() == lastLogin.getDate()) {
      return Species(me.todayLuck, cb);
    }
  }

  me.lastLogin = new Date();
  me.todayLuck = _.random(1, Species.total);
  me.save(function(err){
    if (err) return callback(err);
    Species(me.todayLuck, cb);
  });
};

// Hide some information from toJSON
TrainerSchema.methods.toJSON = function(options){
  var res = mongoose.Document.prototype.toJSON.call(this, options);
  return _.omit(res, ['pokedexCaughtHex', 'pokedexSeenHex'
    , 'storage', 'storagePokemon', 'bag', 'todayLuck']);
};

// Find trainer by name, and init necessary information
TrainerSchema.statics.findByName = function(name, callback){
  this.findOne({ name: name })
  .populate('party')
  .exec(function(err, trainer){
    if (err) return callback(err);
    if (!trainer) return callback(null, null);

    async.series([
      trainer.initParty.bind(trainer)
      ,trainer.todaySpecies.bind(trainer)
    ], function(err){
      if (err) return callback(err);
      callback(null, trainer);
    });
  });
};

TrainerSchema.index({ name: 1 });

var Trainer = mongoose.model('Trainer', TrainerSchema);
module.exports = Trainer;