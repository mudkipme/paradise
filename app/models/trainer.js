var mongoose = require('mongoose');
var async = require('async');
var BitArray = require('bit-array');
var _ = require('underscore');
var Geode = require('geode');
var time = require('time');
var Species = require('./species');
var Pokemon = require('./pokemon');
var Msg = require('./msg');
var Log = require('./log');
var config = require('../../config.json');

var Schema = mongoose.Schema;
var geode = new Geode(config.thirdParty.geonames, {});

var TrainerSchema = new Schema({
  name:             String,
  trainerId:        Number,
  pokedexHex: {
    caught:         String,
    seen:           String,
    formM:          String,
    formF:          String,
    formMS:         String,
    formFS:         String
  },
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
  encounter: {
    location:       String,
    area:           String,
    method:         String,
    pokemon:        { type: Schema.Types.ObjectId, ref: 'Pokemon' },
    battleResult:   String,
    battlePokemon:  { type: Schema.Types.ObjectId, ref: 'Pokemon' },
    time:           Date
  },
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
  catchTime:        { type: Number, default: 0 },
  eventPokemonTime: { type: Number, default: 0 },
  eventItemTime:    { type: Number, default: 0 },
  hatchTime:        { type: Number, default: 0 },
  evolveTime:       { type: Number, default: 0 },
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

TrainerSchema.virtual('localTime').get(function(){
  if (this._localTime) {
    return this._localTime;
  }
  this._localTime = new time.Date();
  this._localTime.setTimezone(this.realWorld.timezoneId);
  return this._localTime;
});

// Get current season
TrainerSchema.virtual('season').get(function(){
  var seasons = ['spring', 'summer', 'autumn', 'winter'];
  return seasons[this.localTime.getMonth() % 4];
});

// Get current time of day
TrainerSchema.virtual('timeOfDay').get(function(){
  var split = {
    spring: [5, 20]
    ,summer: [4, 21]
    ,autumn: [6, 20]
    ,winter: [7, 19]
  };
  var hour = this.localTime.getHours(), season = this.season;
  if (hour >= split[season][0] && hour < 10) {
    return 'morning';
  } else if (hour >= 10 && hour < split[season][1]) {
    return 'day';
  } else {
    return 'night';
  }
});

TrainerSchema.methods.initPokedex = function(){
  var me = this;
  if (me._pokedex) return;
  var dexes = ['caught', 'seen', 'formM', 'formF', 'formMS', 'formFS'];
  me._pokedex = {};

  _.each(dexes, function(dexName){
    me._pokedex[dexName] = new BitArray(Species.max, me.pokedexHex[dexName]);
  });
}

TrainerSchema.methods.setPokedexSeen = function(pokemon){
  this.initPokedex();
  this._pokedex.seen.set(pokemon.speciesNumber, true);

  var gender = pokemon.gender == 1 ? 'F' : 'M';
  var appendix = pokemon.isShiny ? 'S' : '';
  var dexName = 'form' + gender + appendix;
  
  this._pokedex[dexName].set(pokemon.species.formId, true);
  this.pokedexHex.seen = this._pokedex.seen.toHexString();
  this.pokedexHex[dexName] = this._pokedex[dexName].toHexString();
  this.pokedexSeenNum = this._pokedex.seen.count();
};

TrainerSchema.methods.setPokedexCaught = function(pokemon){
  this.initPokedex();
  this.setPokedexSeen(pokemon);
  this._pokedex.caught.set(pokemon.speciesNumber, true);
  this.pokedexHex.caught = this._pokedex.caught.toHexString();
  this.pokedexCaughtNum = this._pokedex.caught.count();
};

TrainerSchema.methods.getPokedex = function(callback) {
  var me = this;
  me.initPokedex();
  Species.allForms(function(err, allForms){

    var result = [];

    _.each(allForms, function(dex, speciesNumber){
      var row = {
        speciesNumber: parseInt(speciesNumber)
        ,name: dex.name
        ,hasGenderDifferences: dex.hasGenderDifferences
        ,seen: me._pokedex.seen.get(speciesNumber)
        ,caught: me._pokedex.caught.get(speciesNumber)
        ,forms: []
      }
      _.each(dex.forms, function(formIdentifier, formId){
        if ((!dex.hasGenderDifferences && me._pokedex.formF.get(formId))
          || me._pokedex.formM.get(formId)) {
          row.forms.push({form: formIdentifier});
        }

        if (dex.hasGenderDifferences && me._pokedex.formF.get(formId)) {
          row.forms.push({form: formIdentifier, female: true});
        }

        if ((!dex.hasGenderDifferences && me._pokedex.formFS.get(formId))
          || me._pokedex.formMS.get(formId)) {
          row.forms.push({form: formIdentifier, shiny: true});
        }

        if (dex.hasGenderDifferences && me._pokedex.formFS.get(formId)) {
          row.forms.push({form: formIdentifier, female: true, shiny: true});
        }
      });
      result.push(row);
    });

    callback(null, result);
  });
};

TrainerSchema.methods.caught = function(species){
  species = _.isObject(species) ? species.number : species;
  this.initPokedex();
  return this._pokedex.caught.get(species);
};

/**
 * Find an empty slot in storage
 */
TrainerSchema.methods.storageSlot = function(){
  var me = this;
  var storageNum = me.storageNum;
  var box = [], boxId;

  // the indexes of all boxes from currentBox
  var boxIds = _.map(_.range(me.currentBox, me.currentBox + storageNum)
    ,function(index){ return index % storageNum; });

  // find the box which has empty slot
  _.some(boxIds, function(id){
    var thisBox = _.where(me.storagePokemon, { boxId: id });
    if (thisBox.length >= 30)
      return false;
    box = thisBox;
    boxId = id;
    return true;
  });

  // add a box when there's no empty slot
  if (_.isUndefined(boxId)) {
    boxId = me.storageNum;
    me.storage.set(boxId, { name: '', wallpaper: '' });
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
    pokemon.meetPlaceIndex = _.isString(location) ? location : location.name;


    pokemon.save(function(err){
      if (err) return callback(err);

      me.setPokedexCaught(pokemon);
      me.save(function(err){
        if (err) return callback(err);
        callback(null, slot);

        me.log('catch', {pokemon: pokemon});
      });
    });
  });
};

/**
 * Init Pokémon data in party
 */
TrainerSchema.methods.initParty = function(callback){
  async.eachSeries(this.party, function(pokemon, next){
    pokemon.initData && pokemon.initData(next);
  }, callback);
};

/**
 * Init the current encounter Pokémon
 */
TrainerSchema.methods.initWild = function(callback){
  if (!this.encounter.pokemon) return callback(null);
  var pokemon = this.encounter.pokemon;
  pokemon.initData && pokemon.initData(callback);
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

  _.some(this.party, function(pm, index){
    var id = partyPopulated ? pm._id : pm;
    if (id.equals(pokemon._id)) {
      result = { party: true, position: index };
      return true;
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

// Get how many Pokémon in party would left if a Pokémon is deposited/released
TrainerSchema.methods.available = function(pokemon){
  var party = _.filter(this.party, function(pm){
    return !pm.isEgg && !pm.pokemonCenter
      && !pm._id.equals(pokemon._id);
  });
  return party.length;
};

// Get the unread msg number
TrainerSchema.methods.unreadMsg = function(callback){
  Msg.where({receiver: this._id, read: false}).count(callback);
};

// Hide some information from toJSON
TrainerSchema.methods.toJSON = function(options){
  var res = mongoose.Document.prototype.toJSON.call(this, options);
  res.localTime = this.localTime.toDateString() + ' ' + this.localTime.toLocaleTimeString();
  return _.omit(res, ['pokedexHex', 'storage', 'storagePokemon', 'bag', 'todayLuck']);
};

// Save a log to me
TrainerSchema.methods.log = function(type, attrs){
  attrs = {
    type: type
    ,trainer: me
    ,params: attrs || {}
  };

  if (attrs.params.relatedTrainer) {
    attrs.relatedTrainer = attrs.params.relatedTrainer;
    delete attrs.params.relatedTrainer;
  }

  var keyMap = {
    'hatch': 'hatchTime'
    ,'evolve': 'evolveTime'
    ,'catch': 'catchTime'
    ,'event-item': 'eventItemTime'
    ,'event-pokemon': 'eventPokemonTime'
  };

  if (keyMap[type]) {
    attrs.key = type;
  }

  Log.addLog(attrs);
};

// Find trainer by name, and init necessary information
TrainerSchema.statics.findByName = function(name, callback){
  this.findOne({ name: name })
  .populate('party encounter.pokemon')
  .exec(function(err, trainer){
    if (err) return callback(err);
    if (!trainer) return callback(null, null);

    async.series([
      trainer.initParty.bind(trainer)
      ,trainer.todaySpecies.bind(trainer)
      ,trainer.initWild.bind(trainer)
    ], function(err){
      if (err) return callback(err);
      callback(null, trainer);
    });
  });
};

TrainerSchema.index({ name: 1 });

var Trainer = mongoose.model('Trainer', TrainerSchema);
module.exports = Trainer;