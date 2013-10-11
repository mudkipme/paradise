/**
 * Location Model
 * @module models/location
 */
var async = require('async');
var _ = require('underscore');
var db = require('../common').baseData;
var Pokemon = require('./pokemon');
var Species = require('./species');

var locationCache = {};

var methodRate = {
  walk: 100
  ,'old-rod': 20
  ,'good-rod': 20
  ,'super-rod': 20
  ,surf: 60
  ,'rock-smash': 5
  ,headbutt: 5
  ,'dark-grass': 30
  ,'grass-spots': 5
  ,'cave-spots': 5
  ,'bridge-spots': 5
  ,'super-rod-spots': 5
  ,'surf-spots': 5
};

var Location = function(identifier, callback){

  if (locationCache[identifier])
    return callback(null, locationCache[identifier]);

  var location = Object.create(locationProto);
  location.name = identifier;

  async.waterfall([
    db.all.bind(db, 'SELECT id FROM locations WHERE identifier = ?', [identifier])

    ,function(rows, next){
      if (!rows.length) return next(null, []);
      location.id = rows[0].id;

      db.all('SELECT encounters.id AS id, version_id, encounter_methods.identifier AS method, rarity, location_areas.identifier AS location_area, pokemon_id, min_level, max_level FROM encounters JOIN encounter_slots ON encounter_slot_id = encounter_slots.id JOIN encounter_methods ON encounter_method_id = encounter_methods.id JOIN location_areas ON location_areas.id = location_area_id WHERE location_id = ?', [location.id], next);
    }

    ,function(rows, next){
      if (!rows.length) return next(null, rows);

      Object.defineProperty(location, 'encounters', {
        enumerable: false
        ,value: rows
      });

      db.all('SELECT encounter_id, identifier FROM encounter_condition_value_map JOIN encounter_condition_values ON encounter_condition_values.id = encounter_condition_value_id WHERE encounter_id IN (' + _.pluck(rows, 'id').join(',') + ')', next);
    }

    ,function(rows, next){
      _.each(rows, function(row){
        var encounter = _.findWhere(location.encounters, {id: row.encounter_id});
        if (encounter) {
          encounter[row.identifier] = true;
        }
      });
      next();
    }

  ], function(err){
    if (err) return callback(err);
    locationCache[identifier] = location;
    callback(null, location);
  });
};

var locationProto = {
  encounter: function(trainer, callback){
    if (trainer.encounter.pokemon)
      return callback(new Error('ALREADY_IN_ENCOUNTER'));

    var me = this;

    // Filter conditions
    var encounters = _.filter(me.encounters, function(encounter){
      if (encounter['swarm-yes'] && !encounter['swarm-no']) return false;
      if (encounter['radar-on'] && !encounter['radar-off']) return false;
      if ((encounter['slot2-ruby'] || encounter['slot2-sapphire']
        || encounter['slot2-emerald'] || encounter['slot2-firered']
        || encounter['slot2-leafgreen']) && !encounter['slot2-none'])
          return false;
      if ((encounter['radio-hoenn'] || encounter['radio-sinnoh'])
        && !encounter['radio-off']) return false;

      if ((encounter['time-morning'] || encounter['time-day']
        || encounter['time-night']) && !encounter['time-' + trainer.timeOfDay])
        return false;

      if ((encounter['season-spring'] || encounter['season-summer']
        || encounter['season-autumn'] || encounter['season-winter'])
        && !encounter['season-' + trainer.season])
        return false;

      return true;
    });
    

    // Choose a game
    encounters = _.sample(_.values(_.groupBy(encounters, 'version_id')));

    // Choose a location area
    encounters = _.sample(_.values(_.groupBy(encounters, 'location_area')));

    // Choose a method
    var methods = _.uniq(_.pluck(encounters, 'method')), rates = [];
    var sum = _.reduce(methods, function(memo, method){
      memo += methodRate[method];
      rates.push(memo);
      return memo;
    }, 0);
    var seed = _.random(0, sum - 1), method = null;
    _.some(rates, function(rate, i){
      if (seed < rate) {
        method = methods[i];
        return true;
      }
    });
    encounters = _.where(encounters, {method: method});

    // Choose an encounter
    var encounter = null;
    rates = [];
    sum = _.reduce(encounters, function(memo, encounter){
      memo += encounter.rarity;
      rates.push(memo);
      return memo;
    }, 0);
    seed = _.random(0, sum - 1);
    _.some(rates, function(rate, i){
      if (seed < rate) {
        encounter = encounters[i];
        return true;
      }
    });

    var result = { location: me.name, time: new Date()
      , battleResult: null, battlePokemon: null };
    if (!encounter) return callback(null, result);

    // Now create this Pokémon
    async.waterfall([
      Species.pokemonId.bind(Species, encounter.pokemon_id)

      ,function(res, next){
        Pokemon.createPokemon({
          speciesNumber: res.species_id
          ,formIdentifier: res.form_identifier
          ,level: _.random(encounter.min_level, encounter.max_level)
        }, next);
      }

      ,function(pokemon, next){
        pokemon.initData(next);
      }

      ,function(pokemon, next){
        pokemon.save(function(err){
          if (err) return next(err);
          result.area = encounter.location_area;
          result.method = encounter.method;
          result.pokemon = pokemon;
          trainer.encounter = result;
          trainer.setPokedexSeen(pokemon);
          trainer.save(next);
        });
      }
    ], function(err){
      if (err) return callback(err);
      callback(err, result);
    });
  }
};

module.exports = Location;