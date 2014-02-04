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
  displayOT:       String,
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

// When the Pokémon egg will hatch
PokemonSchema.virtual('hatchRate').get(function(){
  if (!this._inited || !this.isEgg || !this.meetDate) return false;
  var cycle = Math.ceil((Date.now() - this.meetDate.getTime()) / (3600000 * config.app.hatchCycleHour));
  var cycleLeft = this.species.hatchTime - cycle;
  if (cycleLeft <= 0)
    return 'hatched';
  else if (cycleLeft <= 5)
    return 'soon';
  else if (cycleLeft <= 10)
    return 'close';
  else
    return 'wait';
});

// Events happened when Pokémon level up
// Options includes the battle stats like location
PokemonSchema.methods.onLevelUp = function(level, options, callback){
  if (!callback) { callback = options; options = {}; }

  var events = {type: 'level', value: level}, me = this;
  var happiness = me.happiness < 100 ? 5 : (me.happiness < 200 ? 3 : 2);

  // Gain friendship
  var actions = [ me.gainHappiness.bind(me, happiness) ];

  // Evolution
  if (level == me.level) {
    actions.push(function(next){
      me.evolve('level-up', options, next);
    });
  }

  async.series(actions, function(err, results){
    if (err) return callback(err);
    events = _.compact(_.flatten([].concat(events, results)));
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

  var events = {type: 'experience', value: me.experience - currentExperience};

  me.save(function(err){
    if (err) return callback(err);

    // Level up events
    async.mapSeries(
      _.range(currentLevel + 1, me.level + 1)
      ,function(level, next){
        me.onLevelUp(level, options, next);
      }
      ,function(err, results){
        if (err) return callback(err);
        events = _.compact(_.flatten([].concat(events, results)));
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
  var me = this;
  if (!me._inited) return callback(new Error('ERR_NOT_INITED'));
  if (me.isEgg) return callback(new Error('ERR_POKEMON_IS_EGG'));
  if (me.happiness >= 255) return callback(null);

  if (!me.populated('trainer')) {
    me.populate('trainer', function(err){
      if (err) return callback(err);
      me.gainHappiness(happiness, callback);
    });
    return;
  }

  if (happiness > 0 && me.holdItem && me.holdItem.name == 'soothe-bell') {
    happiness = Math.round(happiness * 1.5);
  }

  if (me.pokeBall && me.pokeBall.name == 'luxury-ball') {
    happiness *= 2;
  }

  if (happiness > 0 && me.speciesNumber == me.trainer.todayLuck) {
    happiness *= 8;
  }

  if (me.happiness + happiness > 255) {
    happiness = 255 - me.happiness;
  }

  if (me.happiness + happiness < 0) {
    happiness = -me.happiness;
  }

  me.happiness += happiness;

  me.save(function(err){
    if (err) return callback(err);
    callback(null, {type: 'happiness', value: happiness});
  });
};

// Gain HP
PokemonSchema.methods.gainHP = function(hp, callback){
  if (this.isEgg) return callback(new Error('ERR_POKEMON_IS_EGG'));
  if (this.pokemonCenterTime) return callback(new Error('POKEMON_IN_PC'));

  var currentHp = this.stats.hp;

  if (hp > this.lostHp) {
    hp = this.lostHp;
  }
  if (-hp > currentHp) {
    hp = -currentHp;
  }
  if (hp == 0) return callback(null);
  this.lostHp -= hp;
  var events = [{type: 'hp', value: hp}];

  // Fainted, send to Pokémon Center
  if (hp == -currentHp) {
    this.pokemonCenter = new Date();
    events.push({type: 'pokemon-center'});
  }

  this.save(function(err){
    if (err) return callback(err);
    callback(null, events);
  });
};

// Gain effort values
PokemonSchema.methods.gainEffort = function(effort, callback){
  if (!_.isObject(effort)) return callback(new Error('ERR_INVALID_PARAM'));

  var me = this,
    currentEffort = _.reduce(me.effort, function(memo, num){
      return memo + num;
    }),
    prevEffort = currentEffort;

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

    if (!effort[key]) {
      delete effort[key];
    }
  });

  if (prevEffort == currentEffort)
    return callback(null);

  me.save(function(err){
    if (err) return callback(err);
    callback(null, {type: 'effort', value: effort});
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
      callback(null, {type: 'forme', value: me.formIdentifier});
    });
  });
};

// Set hold item
PokemonSchema.methods.setHoldItem = function(item, callback){
  if (this.isEgg) return callback(new Error('ERR_POKEMON_IS_EGG'));
  if (this.pokemonCenterTime) return callback(new Error('POKEMON_IN_PC'));
  
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
// The first parameter is whether/which will be populated from trainer 
PokemonSchema.methods.initData = function(trainer, callback){
  var me = this;
  if (!callback) {
    callback = trainer;
    trainer = false;
  }
  if (me._inited) return callback(null, me);

  var inits = [];

  inits.push(function(next){
    Pokemon.initPokemon(me, function(err, results){
      if (err) return next(err);
      me._species = results.species;
      me._nature = results.nature;
      me._pokeBall = results.pokeBall;
      me._holdItem = results.holdItem;
      next();
    });
  });

  if (me.trainer && trainer) {
    inits.push(me.populate.bind(me, 'trainer', _.isString(trainer) ? trainer : true));
  }

  if (me.originalTrainer) {
    inits.push(me.populate.bind(me, 'originalTrainer', 'name'));
  }

  if (me.pokemonCenter && !me.pokemonCenterTime) {
    inits.push(function(next){
      me.pokemonCenter = null;
      me.lostHp = 0;
      me.save(next);
    });
  }

  async.series(inits, function(err, results){
    if (err) return callback(err);
    me._inited = true;

    // Hatch the Pokémon Egg!
    if (me.hatchRate == 'hatched') {
      me.isEgg = false;
      me.save(callback);
      me.trainer.log('hatch', {pokemon: me});
    } else {
      callback(null, me);
    }
  });
};

// Evolve this Pokémon
// Options:
// * item
// * location
// * relatedPokemon
PokemonSchema.methods.evolve = function(trigger, options, callback){
  if (!callback) {
    callback = options;
    options = {};
  }
  var me = this;
  if (!me._inited) return callback(new Error('ERR_NOT_INITED'));
  if (me.holdItem && me.holdItem.name == 'everstone') return callback(null);

  if (me.trainer && !me.populated('trainer')) {
    me.populate('trainer', function(err){
      if (err) return callback(err);
      me.evolve(trigger, options, callback);
    });
    return;
  }

  if (!me.trainer.populated('party')) {
    me.trainer.populate('party', function(err){
      if (err) return callback(err);
      me.evolve(trigger, options, callback);
    });
    return;
  }

  var resultNumber = null;
  _.each(me.species.evolutions, function(ev){
    if (ev.trigger != trigger)
      return;
    if (ev.trigger_item_id && (!options.item || ev.trigger_item_id != options.item.id))
      return;
    if (ev.minimum_level && me.level < ev.minimum_level)
      return;
    if (ev.gender_id && me.gender != ev.gender_id)
      return;
    if (ev.location && options.location != ev.location)
      return;
    if (ev.held_item_id && me.holdItemId != ev.held_item_id)
      return;
    if (ev.time_of_day) {
      if (!me.trainer) return;
      var timeOfDay = me.trainer.timeOfDay;
      if (ev.time_of_day == 'night' && timeOfDay != 'night') return;
      if (ev.time_of_day != 'night' && timeOfDay == 'night') return;
    }
    // Temporary solution for evolve by learning a move
    if (ev.known_move_id == 102
      && !(me.speciesNumber == 439 && me.level >= 15)
      && !(me.speciesNumber == 438 && me.level >= 33))
      return;
    if (ev.known_move_id == 458 && me.level < 32)
      return;
    if (ev.known_move_id == 205 && me.level < 33)
      return;
    if (ev.known_move_id == 246
      && !(ev.evolved_species_id == 465 && me.level >= 40)
      && !(ev.evolved_species_id == 469 && me.level >= 33)
      && !(ev.evolved_species_id == 473 && me.level >= 45))
      return;
    if (ev.minimum_happiness && me.happiness < ev.minimum_happiness)
      return;
    // Will add Contest-related stuff in future
    if (ev.minimum_beauty)
      return;
    if (ev.relative_physical_stats !== null) {
      var stats = me.stats;
      if (ev.relative_physical_stats == 1 && !stats.attack > stats.defense)
        return;
      if (ev.relative_physical_stats == -1 && !stats.attack < stats.defense)
        return;
      if (ev.relative_physical_stats === 0 && stats.attack != stats.defense)
        return;
    }
    if (ev.party_species_id && (!me.trainer || !_.find(me.trainer.party
        ,function(pokemon){ return pokemon.speciesNumber == pokemon.party_species_id })
      ))
      return;
    if (ev.trade_species_id && (!options.relatedPokemon
     || options.relatedPokemon.speciesNumber != ev.trade_species_id))
      return;

    resultNumber = ev.evolved_species_id;
  });

  if (!resultNumber) return callback(null);

  // Evolve this Pokémon
  var before = me.toObject();
  me.speciesNumber = resultNumber;
  Species(me.speciesNumber, me.formIdentifier, function(err, species){
    if (err) return callback(err);
    me._species = species;
    me.formIdentifier = species.formIdentifier;
    me.trainer.setPokedexCaught(me);
    me.save(function(err){
      if (err) return callback(err);
      me.trainer.save(function(err){
        if (err) return callback(err);
        callback(null, {type: 'evolution', value: me.species.name});
        me.trainer.log('evolve', {pokemon: me});
      });
    });
  });
};

// Hide some information from toJSON
PokemonSchema.methods.toJSON = function(options){
  var res = mongoose.Document.prototype.toJSON.call(this, options);
  if (this.populated('originalTrainer')) {
    res.originalTrainer = _.pick(res.originalTrainer, 'id', 'name');
  }
  if (this.populated('trainer')) {
    res.trainer = res.trainer.id;
  }

  return _.omit(res, ['individual', 'effort', 'lostHp'
    , 'natureId', 'holdItemId', 'pokeBallId']);
};

PokemonSchema.statics.createPokemon = function(opts, callback){
  Species(opts.speciesNumber, opts.formIdentifier, function(err, species){
    if (err) return callback(err);

    var gender, natureId, level = opts.isEgg ? 1 : (opts.level || 5),
      experience = species.experience(level),
      individual = {}, effort = {};

    // Gender
    if (species.genderRadio == -1) {
      gender = Gender.genderless;
    } else if (species.genderRadio == 0) {
      gender = Gender.male;
    } else if (species.genderRadio == 8) {
      gender = Gender.female;
    } else if (opts.gender > 0 && opts.gender != 3) {
      gender = parseInt(opts.gender);
    } else {
      gender = _.random(0, 7) < species.genderRadio ? Gender.female : Gender.male;
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
      opts.isShiny = _.random(0, 8191) == 0;
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
      displayOT: opts.displayOT || null,
      birthDate: opts.birthDate || new Date(),
      father: opts.father || null,
      mother: opts.mother || null,
      holdItemId: opts.holdItemId || (opts.holdItem && opts.holdItem.id) || null
    });

    callback(null, pokemon);
  });
};

// Init a Pokémon JSON object
PokemonSchema.statics.initPokemon = function(pokemon, callback){
  var inits = {
    species: async.apply(Species, pokemon.speciesNumber, pokemon.formIdentifier)
    ,nature: async.apply(Nature, pokemon.natureId)
  };

  if (pokemon.pokeBallId) {
    inits.pokeBall = async.apply(Item, pokemon.pokeBallId);
  }

  if (pokemon.holdItemId) {
    inits.holdItem = async.apply(Item, pokemon.holdItemId);
  }

  async.series(inits, callback);
};

PokemonSchema.index({ trainer: 1 });

var Pokemon = mongoose.model('Pokemon', PokemonSchema);
module.exports = Pokemon;