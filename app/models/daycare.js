var mongoose = require('mongoose');
var async = require('async');
var _ = require('underscore');
var geolib = require('geolib');
var Species = require('./species');
var Pokemon = require('./pokemon');

var Schema = mongoose.Schema;

var DayCareSchema = new Schema({
  pokemonA:       { type: Schema.Types.ObjectId, ref: 'Pokemon' },
  pokemonB:       { type: Schema.Types.ObjectId, ref: 'Pokemon' },
  egg:            { type: Schema.Types.ObjectId, ref: 'Pokemon' },
  trainerA:       { type: Schema.Types.ObjectId, ref: 'Trainer' },
  trainerB:       { type: Schema.Types.ObjectId, ref: 'Trainer' },
  eggTrainer:     { type: Schema.Types.ObjectId, ref: 'Trainer' },
  createTime:     Date,
  fillTime:       Date,
  breedRate:      Number
}, {
  toJSON: { virtuals: true, minimize: false }
});

// Init the Day Care
DayCareSchema.methods.initData = function(callback){
  var me = this;
  me.populate('pokemonA pokemonB egg', function(err){
    if (err) return callback(err);
    async.eachSeries(_.compact([me.pokemonA, me.pokemonB, me.egg])
      ,function(pokemon, next){
        pokemon.initData('name realWorld', next);
      }, function(err){
        if (err) return callback(err);
        me._inited = true;
        callback(null);
      });
  });
};

DayCareSchema.methods.deposit = function(pokemon, callback){
  var me = this;
  if (me.pokemonB) return callback(new Error('DAY_CARE_FULL'));
  if (me.egg) return callback(new Error('TAKE_EGG_FIRST'));
  if (pokemon.isEgg) return callback(new Error('ERR_POKEMON_IS_EGG'));
  if (pokemon.pokemonCenter) return callback(new Error('POKEMON_IN_PC'));

  if (me.pokemonA && _.isEqual((me.pokemonA._id || me.pokemonA), pokemon._id))
    return callback(new Error('ALREADY_JOINED'));

  if (!me.pokemonA) {
    me.pokemonA = pokemon;
    me.trainerA = pokemon.trainer;
    me.createTime = new Date();
  } else {
    me.pokemonB = pokemon;
    me.trainerB = pokemon.trainer;
    me.fillTime = new Date();
  }

  me.initData(function(err){
    if (err) return callback(err);
    me.breedRate = me.getBreedRate();
    me.save(callback);
  });
};

DayCareSchema.methods.withdraw = function(pokemon, callback){
  if (!this._inited) return callback(null, new Error('ERR_NOT_INITED'));
  if (this.egg && _.isEqual(pokemon._id, this.egg._id)) {
    this.egg = null;
    this.fillTime = new Date();
    return this.save(callback);
  }

  this.fillTime = null;
  this.breedRate = null;

  if (this.pokemonB && _.isEqual(pokemon._id, this.pokemonB._id)) {
    this.pokemonB = null;
    this.trainerB = null;
    return this.save(callback);
  }

  if (this.pokemonA && _.isEqual(pokemon._id, this.pokemonA._id)) {
    if (this.pokemonB) {
      this.pokemonA = this.pokemonB;
      this.trainerA = this.trainerB;
      this.pokemonB = null;
      this.trainerB = null;
      return this.save(callback);
    } else if (this.egg) {
      this.pokemonA = null;
      this.trainerA = null;
      return this.save(callback);
    }

    return this.remove(callback);
  }

  callback(new Error('POKEMON_NOT_FOUND'));
};

DayCareSchema.statics.newDayCare = function(pokemon, callback){
  if (pokemon.isEgg) return callback(new Error('ERR_POKEMON_IS_EGG'));
  if (pokemon.pokemonCenterTime) return callback(new Error('POKEMON_IN_PC'));
  
  var dayCare = new DayCare({
    pokemonA: pokemon
    ,trainerA: pokemon.trainer
    ,createTime: new Date
  });

  dayCare.save(function(err){
    if (err) callback(err);
    callback(null, dayCare);
  });
};

DayCareSchema.methods.compatible = function(){
  if (!this.pokemonA || !this.pokemonB || !this._inited) return;
  var sameEggGroups = _.intersection(this.pokemonA.species.eggGroups, this.pokemonB.species.eggGroups);

  if (_.findWhere(this.pokemonA.species.eggGroups, {name: 'no-eggs'})
    || _.findWhere(this.pokemonB.species.eggGroups, {name: 'no-eggs'}))
    return false;

  // As in anime, Pokémon like Staryu can breed without Ditto
  if ((this.pokemonA.gender == 1 && this.pokemonB.gender == 1)
    || (this.pokemonA.gender == 2 && this.pokemonB.gender == 2))
    return false;

  if (this.pokemonA.species.name == 'ditto' && this.pokemonB.species.name == 'ditto')
    return false;

  if (this.pokemonA.species.name == 'ditto' || this.pokemonB.species.name == 'ditto')
    return true;

  if (!sameEggGroups.length == 0)
    return false;
  
  return true;
};

DayCareSchema.methods.getBreedRate = function(){
  if (!this._inited) return false;
  if (!this.compatible()) return 0;

  var sameSpecies = this.pokemonA.speciesNumber == this.pokemonB.speciesNumber;
  var diffId = !_.isEqual(this.pokemonA.originalTrainer._id, this.pokemonB.originalTrainer._id);

  if (sameSpecies && diffId)
    return 70;

  if (sameSpecies && !diffId)
    return 50;

  if (!sameSpecies && diffId)
    return 50;

  if (!sameSpecies && !diffId)
    return 20;
};

DayCareSchema.methods.mother = function(){
  if (!this._inited) return false;
  if (!this.compatible()) return false;
  if (this.pokemonA.species.name == 'ditto') return this.pokemonB;
  if (this.pokemonB.species.name == 'ditto') return this.pokemonA;
  if (this.pokemonA.gender == 1) return this.pokemonA;
  if (this.pokemonB.gender == 1) return this.pokemonB;
  return _.random(0, 1) ? this.pokemonA : this.pokemonB;
};

DayCareSchema.methods.breed = function(callback){
  var me = this;

  if (!me._inited) {
    me.initData(function(err){
      if (err) return callback(err);
      me.breed(callback);
    });
    return;
  }
  if (!me.compatible()) return callback(null);
  if (me.egg) return callback(null);

  // Breed the Pokémon
  var mother = me.mother();
  var father = _.isEqual(mother._id, me.pokemonA._id) ? me.pokemonB : me.pokemonA;

  // Inherit nature
  var nature;
  if (mother.holdItem && mother.holdItem.name == 'everstone') {
    nature = mother.nature;
  }
  if (father.holdItem && father.holdItem.name == 'everstone') {
    if (!nature) {
      nature = father.nature;
    } else {
      nature = _.random(0, 1) ? nature : father.nature;
    }
  }

  // Inherit individual values
  var individual = {};
  var stats = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'];
  var motherStat = mother.holdItem && mother.holdItem.inhertIV();
  var fatherStat = father.holdItem && father.holdItem.inhertIV();
  if (motherStat && motherStat != fatherStat) {
    individual[motherStat] = mother.individual[motherStat];
    stats = _.without(stats, motherStat);
  }
  if (fatherStat && fatherStat != motherStat) {
    individual[fatherStat] = father.individual[fatherStat];
    stats = _.without(stats, fatherStat);
  }
  if (motherStat && motherStat == fatherStat) {
    individual[motherStat] = (_.random(0, 1) ? mother : father).individual[motherStat];
    stats = _.without(stats, motherStat);
  }
  while (stats.length > 3) {
    var statName = _.sample(stats);
    individual[statName] = (_.random(0, 1) ? mother : father).individual[statName];
    stats = _.without(stats, statName);
  }
   
  // Shiny
  var isShiny;
  var motherLoc = (mother.trainer && mother.trainer.realWorld) || {};
  var fatherLoc = (father.trainer && father.trainer.realWorld) || {};
  var masudaMethod = false;
  if (fatherLoc.countryCode && motherLoc.countryCode
    && fatherLoc.countryCode != motherLoc.countryCode) {
    masudaMethod = true;
  }
  if (fatherLoc.timezoneId && motherLoc.timezoneId
    && fatherLoc.timezoneId != motherLoc.timezoneId) {
    masudaMethod = true;
  }
  if (_.isNumber(fatherLoc.latitude) && _.isNumber(motherLoc.longitude)
    && geolib.getDistance(fatherLoc, motherLoc) > 2000000) {
    masudaMethod = true;
  }
  if (masudaMethod) {
    isShiny = _.random(0, 8191) < 6;
  }

  me.eggTrainer = _.random(0, 1) ? me.trainerA : me.trainerB;

  async.waterfall([
    Species.getBabySpecies.bind(Species, mother)

    ,function(speciesNumber, next){
      Pokemon.createPokemon({
        speciesNumber: speciesNumber
        ,level: 1
        ,nature: nature
        ,individual: individual
        ,isEgg: true
        ,isShiny: isShiny
        ,father: father
        ,mother: mother
        ,originalTrainer: me.eggTrainer
      }, next);
    }
  ], function(err, pokemon){
    if (err) return callback(err);
    pokemon.save(function(err){
      if (err) return callback(err);
      me.egg = pokemon;
      me.save(callback);
    });
  });
};

var DayCare = mongoose.model('DayCare', DayCareSchema);
module.exports = DayCare;