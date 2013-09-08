var crypto = require('crypto');
var mongoose = require('mongoose');
var async = require('async');
var _ = require('underscore');
var Schema = mongoose.Schema;
var config = require('../../config.json');
var Species = require('./species');
var Nature = require('./nature');
var Item = require('./item');

// Gender values
var Gender = { female: 1, male: 2, genderless: 3 };

var PokemonSchema = new Schema({
  speciesNumber:   Number,
  formIdentifier:  String,
  gender:          Number,
  lostHp:          Number,
  natureId:        { type: Number, min: 1, max: Nature.max },
  experience:      Number,
  level:           { type: Number, min: 1, max: 100, default: 1 },
  individual: {
    'hp':              { type: Number, min: 0, max: 31 },
    'attack':          { type: Number, min: 0, max: 31 },
    'defense':         { type: Number, min: 0, max: 31 },
    'special-attack':  { type: Number, min: 0, max: 31 },
    'special-defense': { type: Number, min: 0, max: 31 },
    'speed':           { type: Number, min: 0, max: 31 }
  },
  effort: {
    'hp':              { type: Number, min: 0, max: 255, default: 0 },
    'attack':          { type: Number, min: 0, max: 255, default: 0 },
    'defense':         { type: Number, min: 0, max: 255, default: 0 },
    'special-attack':  { type: Number, min: 0, max: 255, default: 0 },
    'special-defense': { type: Number, min: 0, max: 255, default: 0 },
    'speed':           { type: Number, min: 0, max: 255, default: 0 }
  },
  isEgg:           { type: Boolean, default: false },
  isShiny:         { type: Boolean, default: false },
  holdItemId:      Number,
  pokeBallId:      Number,
  trainer:         { type: Schema.Types.ObjectId, ref: 'Trainer' },
  happiness:       { type: Number, min: 0, max: 255 },
  nickname:        String,
  originalTrainer: { type: Schema.Types.ObjectId, ref: 'Trainer' },
  meetLevel:       { type: Number, min: 1, max: 100 },
  meetPlaceIndex:  String,
  meetDate:        Date,
  birthDate:       { type: Date, default: Date.now },
  mother:          { type: Schema.Types.ObjectId, ref: 'Pokemon' },
  father:          { type: Schema.Types.ObjectId, ref: 'Pokemon' },
  tradable:        { type: Boolean, default: config.app.acceptTrade },
  pokemonCenter:   Date
}, {
  toJSON: { virtuals: true, minimize: false }
});

_.each(['species', 'nature', 'pokeBall', 'holdItem'], function(key){
  PokemonSchema.virtual(key).get(function(){
    return this['_' + key];
  });
});

// Shorter ID String
PokemonSchema.virtual('displayId').get(function(){
  var md5 = crypto.createHash('md5');
  return md5.update(this.id.toString()).digest("hex").toString().substr(-6);
});

// Pokémon Stats
PokemonSchema.virtual('stats').get(function(){
  if (!this._inited || this.isEgg) return false;

  var me = this, base = me.species.base, stats = {};
  var lostHp = me.lostHp;

  stats.maxHp = Math.round((
    me.individual.hp + 2 * base.hp
    + me.effort.hp / 4 + 100
  ) * me.level / 100 + 10);

  if (me.pokemonCenter) {
    lostHp -= Math.floor(
      (Date.now() - me.pokemonCenter.getTime()) / 36e5
      * config.app.pokemonCenterHP);
  }

  if (lostHp <= 0) { lostHp = 0; }
  if (lostHp > stats.maxHp) { lostHp = stats.maxHp; }
  stats.hp = stats.maxHp - lostHp;

  var sn = ['attack', 'defense', 'special-attack', 'special-defense', 'speed'];
  _.each(sn, function(type){
    stats[type] = (
      me.individual[type] + 2 * base[type]
      + me.effort[type] / 4
    ) * me.level / 100 + 5;
    if (me.nature.decreasedStat == type) {
      stats[type] = stats[type] * 0.9;
    }
    if (me.nature.increasedStat == type) {
      stats[type] = stats[type] * 1.1;
    }
    stats[type] = Math.round(stats[type]);
  });

  return stats;
});

// Caculate the rest time in Pokémon Center
PokemonSchema.virtual('pokemonCenterTime').get(function(){
  if (!this.pokemonCenter) return 0;

  var time = this.lostHp / config.app.pokemonCenterHP * 36e5
    + this.pokemonCenter.getTime() - Date.now();

  if (time < 0) return 0;
  return Math.ceil(time);
});

// Experience of the current level of this Pokémon
PokemonSchema.virtual('expCurrentLevel').get(function(){
  if (!this._inited || this.isEgg) return false;
  return this.species.experience(this.level);
});


// Experience of the next level of this Pokémon
PokemonSchema.virtual('expNextLevel').get(function(){
  if (!this._inited || this.isEgg) return false;
  if (this.level == 100) {
    return this.experience;
  } else {
    return this.species.experience(this.level + 1);
  }
});

// Events happened when Pokémon level up
// Options includes the battle stats like location
PokemonSchema.methods.onLevelUp = function(level, options, callback){
  if (!callback) { callback = options; options = null; }

  var events = {level: level}, me = this;
  var happiness = me.happiness < 100 ? 5 : (me.happiness < 200 ? 3 : 2);

  async.series([
    // Gain friendship
    me.gainHappiness.bind(me, happiness)

    // Evolution
  ], function(err, results){
    if (err) return callback(err);
    events = _.flatten([].concat(events, results));
    callback(null, events);
  });
};

// Gain experience
// The callback(err, events) contains all events happened by
// gain the given experience, including experience achieved,
// level up, evolution, etc.
PokemonSchema.methods.gainExperience = function(exp, options, callback){
  if (!callback) { callback = options; options = null; }

  var me = this;
  if (!me._inited) return callback(new Error('ERR_NOT_INITED'));
  if (me.isEgg) return callback(new Error('ERR_POKEMON_IS_EGG'));

  var maxExp = me.species.maxExperience(),
    currentLevel = me.level,
    currentExperience = me.experience;
  if (me.experience >= maxExp) return callback(null, 0);

  me.experience = Math.min(me.experience + exp, maxExp);

  // Reset the current level
  me.level = _.find(_.range(currentLevel, 100), function(level){
    return me.experience < me.species.experience(level + 1);
  }) || 100;

  if (me.experience == currentExperience) return callback(null);

  var events = { experience: me.experience - currentExperience };

  me.save(function(err){
    if (err) return callback(err);

    // Level up events
    async.times(me.level - currentLevel
      ,me.onLevelUp.bind(me, options)
      ,function(err, results){
        if (err) return callback(err);
        events = _.flatten([].concat(events, results));
        callback(null, events);
      });
  });
};

// Level up this Pokémon
PokemonSchema.methods.levelUp = function(callback){
  var me = this;
  if (!me._inited) return callback(new Error('ERR_NOT_INITED'));
  if (me.isEgg) return callback(new Error('ERR_POKEMON_IS_EGG'));
  
  if (me.level >= 100) return callback(null);
  me.level += 1;
  me.experience = me.species.experience(me.level);

  me.save(function(err){
    if (err) return callback(err);
    me.onLevelUp(me.level, callback);
  });
};

// Gain friendship
PokemonSchema.methods.gainHappiness = function(happiness, callback){
  if (this.isEgg) return callback(new Error('ERR_POKEMON_IS_EGG'));
  if (this.happiness >= 255) return callback(null);

  if (this.happiness + happiness > 255) {
    happiness = 255 - this.happiness;
  }

  if (this.happiness + happiness < 0) {
    happiness = -this.happiness;
  }

  this.happiness += happiness;

  this.save(function(err){
    if (err) return callback(err);
    callback(null, {happiness: happiness});
  });
};

// Gain HP
PokemonSchema.methods.gainHP = function(hp, callback){
  if (this.isEgg) return callback(new Error('ERR_POKEMON_IS_EGG'));
  if (this.pokemonCenterTime) return callback(new Error('POKEMON_IN_PC'));
  if (!this.lostHp) return callback(null);

  var recoveredHp = hp < this.lostHp ? hp : this.lostHp;
  this.lostHp -= recoveredHp;

  me.save(function(err){
    if (err) return callback(err);
    callback(null, {hp: recoveredHp});
  });
};

// Gain effort values
PokemonSchema.methods.gainEffort = function(effort, callback){
  if (!_.isObject(effort)) return callback(new Error('ERR_INVALID_PARAM'));

  var me = this,
    currentEffort = _.reduce(me.effort, function(memo, num){
      return memo + num;
    });

  _.each(me.effort, function(value, key){
    effort[key] = effort[key] || 0;

    if (value + effort[key] > 255) {
      effort[key] = 255 - value;
    }

    if (value + effort[key] < 0) {
      effort[key] = -value;
    }

    if (currentEffort + effort[key] > 510) {
      effort[key] = 510 - currentEffort;
    }

    me.effort[key] += effort[key];
    currentEffort += effort[key];
  });

  me.save(function(err){
    if (err) return callback(err);
    callback(null, {effort: effort});
  });
};

// Change Forme
PokemonSchema.methods.changeForme = function(formIdentifier, callback){
  var me = this;
  Species(me.speciesNumber, formIdentifier, function(err, species){
    if (err) return callback(err);

    me.formIdentifier = species.formIdentifier;
    me._species = species;
    me.save(function(err){
      if (err) return callback(err);
      callback(null, {forme: me.formIdentifier});
    });
  });
};

// Set hold item
PokemonSchema.methods.setHoldItem = function(item, callback){
  if (item) {
    if (!item.holdable) return callback(new Error('ITEM_NOT_HOLDABLE'));
    this._holdItem = item;
    this.holdItemId = item.id;
  } else {
    this._holdItem = null;
    this.holdItemId = null;
  }

  this.save(callback);
};

// Init data of this Pokémon
PokemonSchema.methods.initData = function(callback){
  var me = this;
  if (me._inited) return callback(null, me);

  var inits = {
    species: async.apply(Species, me.speciesNumber, me.formIdentifier)
    ,nature: async.apply(Nature, me.natureId)
  };

  if (me.pokeBallId) {
    inits.pokeBall = async.apply(Item, me.pokeBallId);
  }

  if (me.holdItemId) {
    inits.holdItem = async.apply(Item, me.holdItemId);
  }

  if (me.originalTrainer) {
    inits.originalTrainer = me.populate.bind(me, 'originalTrainer', 'name');
  }

  if (me.pokemonCenter && !me.pokemonCenterTime) {
    inits.pokemonCenter = function(next){
      me.pokemonCenter = null;
      me.lostHp = 0;
      me.save(next);
    };
  }

  async.series(inits, function(err, results){
    if (err) return callback(err);
    me._species = results.species;
    me._nature = results.nature;
    me._pokeBall = results.pokeBall;
    me._holdItem = results.holdItem;
    me._inited = true;
    callback(null, me);
  });
};

// Hide some information from toJSON
PokemonSchema.methods.toJSON = function(options){
  var res = mongoose.Document.prototype.toJSON.call(this, options);
  return _.omit(res, ['individual', 'effort', 'lostHp'
    , 'natureId', 'holdItemId', 'pokeBallId']);
};

PokemonSchema.statics.createPokemon = function(opts, callback){
  Species(opts.speciesNumber, opts.formIdentifier, function(err, species){
    if (err) return callback(err);

    var gender, natureId, level = opts.level || 5,
      experience = species.experience(level),
      individual = {}, effort = {};

    // Gender
    if (species.genderRadio == -1) {
      gender = Gender.genderless;
    } else if (species.genderRadio == 0) {
      gender = Gender.male;
    } else if (species.genderRadio == 8) {
      gender = Gender.female;
    } else {
      gender = opts.gender
        || _.random(0, 7) < species.genderRadio ? Gender.female : Gender.male;
    }

    // Nature
    natureId = opts.natureId || (opts.nature && opts.nature.id)
      || _.random(1, Nature.max);

    // Species stats and Base stats
    var individual = {}, effort = {};
    _.each(['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'],
      function(key) {
        individual[key] = _.random(0, 31);
        effort[key] = 0;
      });
    _.extend(individual, opts.individual);
    _.extend(effort, opts.effort);

    // Alternate color
    if (!opts.isShiny && opts.isShiny !== false) {
      opts.isShiny = _.random(0, 8192) == 0;
    }

    pokemon = new Pokemon({
      speciesNumber: species.number,
      formIdentifier: species.formIdentifier,
      gender: gender,
      natureId: natureId,
      lostHp: 0,
      experience: experience,
      level: level,
      individual: individual,
      isEgg: Boolean(opts.isEgg),
      isShiny: Boolean(opts.isShiny),
      happiness: opts.happiness || species.baseHappiness,
      originalTrainer: opts.originalTrainer || null,
      birthDate: opts.birthDate || new Date(),
      father: opts.father || null,
      mother: opts.mother || null
    });

    callback(null, pokemon);
  });
};

var Pokemon = mongoose.model('Pokemon', PokemonSchema);
module.exports = Pokemon;