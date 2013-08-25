var crypto = require('crypto');
var mongoose = require('mongoose');
var async = require('async');
var _ = require('underscore');
var Schema = mongoose.Schema;
var config = require('../../config.json');
var Species = require('./species');
var Nature = require('./nature');
var Item = require('./item');

/**
 * Gender values
 */
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

/**
 * Shorter ID String
 */
PokemonSchema.virtual('displayId').get(function(){
  var md5 = crypto.createHash('md5');
  return md5.update(this.id.toString()).digest("hex").toString().substr(-6);
});

/**
 * Pokémon Stats
 */
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

/**
 * 神奇宝贝升级时的操作
 */
PokemonSchema.methods.onLevelUp = function(callback){
  // Gain happiness
  // Evolution
};

// Gain experience
PokemonSchema.methods.gainExperience = function(exp, callback){
  if (this.isEgg) return callback(new Error('ERR_POKEMON_IS_EGG'));

  this.initData(function(err, me){
    if (err) return callback(err);

    var maxExp = me.species.maxExperience(),
      currentLevel = me.level,
      currentExperience = me.experience;
    if (me.experience >= maxExp) return callback(null, 0);

    me.experience = Math.min(me.experience + exp, maxExp);

    me.level = _.find(_.range(currentLevel, 101), function(level){
      if (me.experience >= me.species.experience(level)
        && me.experience < me.species.experience(level + 1))
          return level;
    });

    // 判断升级事件
    async.times(me.level - currentLevel, function(n, next){
      me.onLevelUp(next);
    }, function(err){
      if (err) return callback(err);

      me.save(function(err){
        if (err) return callback(err);
        callback(null, me.experience - currentExperience);
      });
    });
  });
};

/**
 * Level up this Pokémon
 */
PokemonSchema.methods.levelUp = function(callback){
  if (this.isEgg) return callback(new Error('ERR_POKEMON_IS_EGG'));

  this.initData(function(err, me) {
    if (err) return callback(err);
    if (me.level >= 100) return callback(new Error('ERR_POKEMON_MAX_EXP'));
    me.experience = me.species.experience(level + 1);
    me.level += 1;
    me.onLevelUp(function(err) {
      if (err) return callback(err);
      me.save(callback);
    });
  });
};

/**
 * Gain happiness
 */
PokemonSchema.methods.gainHappiness = function(happiness, callback){
  if (this.isEgg) return callback(new Error('ERR_POKEMON_IS_EGG'));
  if (this.happiness >= 255) return callback(null);

  var currentHappiness = this.happiness;
  this.happiness = Math.min(this.happiness + happiness, 255);

  me.save(callback);
};

/**
 * Gain effort values
 */
PokemonSchema.methods.gainEffort = function(effort, callback){
  if (!_.isObject(effort)) return callback(new Error('ERR_INVALID_PARAM'));

  var me = this,
    currentEffort = _.reduce(me.effort, function(memo, num){
      return memo + num;
    });

  _.each(me.effort, function(value, key) {
    var e = effort[key] || 0;
    me.effort[key] = Math.min( me.effort[key] + e, 255 );
    currentEffort += me.effort[key] - value;

    if (currentEffort >= 510) {
      me.effort[key] -= currentEffort - 510;
      return false;
    }
  });

  me.save(callback);
}

/**
 * Set hold item
 */
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

/**
 * Init data of this Pokémon
 */
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