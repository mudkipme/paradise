var mongoose = require('mongoose');
var async = require('async');
var _ = require('underscore');
var Schema = mongoose.Schema;
var config = require('../../config.json');
var Species = require('./species');
var Nature = require('./nature');

/**
 * 性别值
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
  tradable:        { type: Boolean, default: config.app.acceptTrade }
}, {
  toJSON: {
    virtuals: true
  }
});

PokemonSchema.virtual('species').get(function(){
  return this._species;
});

PokemonSchema.virtual('nature').get(function(){
  return this._nature;
});

/**
 * 计算神奇宝贝的能力值
 */
PokemonSchema.virtual('stats').get(function(){
  if (!this._inited || this.isEgg) return false;

  var me = this, base = me.species.base, stats = {};

  stats['max-hp'] = Math.round((
    me.individual.hp + 2 * base.hp
    + me.effort.hp / 4 + 100
  ) * me.level / 100 + 10);

  if (me.lostHp > stats['max-hp']) { me.lostHp = stats['max-hp']; }

  stats['hp'] = stats['max-hp'] - me.lostHp;

  ['attack', 'defense', 'special-attack', 'special-defense', 'speed'].forEach(function(type){
    stats[type] = (
      me.individual[type] + 2 * base[type]
      + me.effort[type] / 4
    ) * level / 100 + 5;
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

/**
 * 神奇宝贝升级时的操作
 */
PokemonSchema.methods.onLevelUp = function(callback){

};

/**
 * 获得经验值
 * @param  {Number}   exp      经验值数字
 */
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
    (function levelUp(times, cb){
      if (!times) return cb();

      me.onLevelUp(function(err){
        if (err) return cb(err);
        levelUp(--times, cb);
      })
    })(me.level - currentLevel, function(err){
      // 保存数据，返回升级的经验值数字
      me.save(function(err){
        if (err) return callback(err);
        callback(null, me.experience - currentExperience);
      });
    });
  });
};

/**
 * 神奇宝贝升级
 */
PokemonSchema.methods.levelUp = function(callback){
  if (this.isEgg) return callback(new Error('ERR_POKEMON_IS_EGG'));

  this.initData(function(err, me){
    if (err) return callback(err);
    if (me.level >= 100) return callback(new Error('ERR_POKEMON_MAX_EXP'));
    me.experience = me.species.experience(level + 1);
    me.level += 1;
    me.onLevelUp(function(err){
      if (err) return callback(err);
      me.save(callback);
    });
  });
};

/**
 * 神奇宝贝获得亲密度
 */
PokemonSchema.methods.gainHappiness = function(happiness, callback){
  if (this.isEgg) return callback(new Error('ERR_POKEMON_IS_EGG'));
  if (this.happiness >= 255) return callback(null);

  var currentHappiness = this.happiness;
  this.happiness = Math.min(this.happiness + happiness, 255);

  me.save(callback);
};

/**
 * 神奇宝贝获得努力值
 */
PokemonSchema.methods.gainEffort = function(effort, callback){
  if (!_.isObject(effort)) return callback(new Error('ERR_INVALID_PARAM'));

  var me = this,
    currentEffort = _.reduce(this.effort, function(memo, num){
      return memo + num;
    });

  this.effort.forEach(function(value, key){
    var e = effort[key] || 0;
    me.effort[key] = Math.min( me.effort[key] + e, 255 );
    currentEffort += me.effort[key] - value;

    if (currentEffort >= 510) {
      me.effort[key] -= currentEffort - 510;
      return false;
    }
  });

  this.save(callback);
}

PokemonSchema.methods.initData = function(callback){
  var me = this;
  if (me._inited) return callback(null, me);
  async.waterfall([
    function(next){
      Species.get(me.speciesNumber, me.formIdentifier, next);
    },
    function(species, next){
      me._species = species;
      Nature.get(me.natureId, next);
    },
    function(nature, next){
      me._nature = nature;
      next();
    }
  ], function(err){
    if (err) return callback(err);
    me._inited = true;
    callback(null, me);
  });
};

PokemonSchema.statics.createPokemon = function(opts, callback){
  Species.get(opts.speciesNumber, opts.formIdentifier, function(err, species){
    if (err) return callback(err);

    var gender, natureId, level = opts.level || 5,
      experience = species.experience(level),
      individual = {}, effort = {};

    // 性别判断
    if (species.genderRadio == -1) {
      gender = Gender.genderless;
    } else if (species.genderRadio == 0) {
      gender = Gender.male;
    } else if (species.genderRadio == 8) {
      gender = Gender.female;
    } else {
      gender = opts.gender || Math.random() * 8 < species.genderRadio ? Gender.female : Gender.male;
    }

    // 性格选择
    natureId = opts.natureId || (opts.nature && opts.nature.id)
           || Math.floor(Math.random() * Nature.max + 1);

    // 个体值和努力值
    var individual = {}, effort = {};
    ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'].forEach(function(key){
      individual[key] = Math.floor(Math.random() * 32);
      effort[key] = 0;
    });
    _.extend(individual, opts.individual);
    _.extend(effort, opts.effort);

    // 闪光
    // TODO：国际结婚判定
    if (!opts.isShiny && opts.isShiny !== false) {
      opts.isShiny = Math.floor(Math.random() * 8192) == 0;
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