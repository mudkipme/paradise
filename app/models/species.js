var async = require('async');
var _ = require('underscore');
var db = require('../common').baseData;
var Type = require('./type');

// Cached Pokémon species data.
// speciesCache[nationalNumber][formIdentifier]
var speciesCache = {};
var pokemonIdCache = {};
var allFormsCache = null;

// Get the Species object
var Species = function(nationalNumber, form, callback){
  if (!callback) {
    callback = form;
    form = null;
  }

  nationalNumber = parseInt(nationalNumber);
  form = form || '0';

  if (speciesCache[nationalNumber] && speciesCache[nationalNumber][form])
    return callback(null, speciesCache[nationalNumber][form]);

  var species = Object.create(speciesProto), raw = null;

  async.waterfall([
    // Pokémon Basic Information
    db.all.bind(db, 'SELECT *, pokemon_forms.id AS form_id, pokemon_species.identifier AS name, pokemon_colors.identifier AS color FROM pokemon_forms JOIN pokemon ON pokemon_forms.pokemon_id = pokemon.id LEFT JOIN pokemon_species ON pokemon.species_id = pokemon_species.id JOIN pokemon_colors ON pokemon_colors.id = color_id WHERE species_id = ?', [nationalNumber])

    ,function(rows, next){
      if (!rows.length) return next(new Error('MissingNo.'));

      if (form && form != 0) {
        raw = _.findWhere(rows, {form_identifier: form});
      }
      raw = raw || _.findWhere(rows, {pokemon_id: nationalNumber});

      species.number = raw.species_id;
      species.name = raw.name;
      species.genderRadio = raw.gender_rate;
      species.growthRate = raw.growth_rate_id;
      species.captureRate = raw.capture_rate;
      species.formIdentifier = raw.form_identifier || '';
      species.formId = raw.form_id;
      species.color = raw.color;
      species.hatchTime = raw.hatch_counter;
      species.height = raw.height;
      species.weight = raw.weight;
      species.baseHappiness = raw.base_happiness;
      species.baseExperience = raw.base_experience;
      species.hasGenderDifferences = raw.has_gender_differences;

      // Pokémon Types
      db.all('SELECT slot, type_id FROM pokemon_types WHERE pokemon_id = ?',
        [raw.pokemon_id], next);
    }
    ,function(rows, next){
      if (!rows.length) return next(new Error('UNKNOWN_TYPE'));

      rows = _.sortBy(rows, function(row){ return row.slot; });
      async.mapSeries(_.pluck(rows, 'type_id'), Type, next);
    }
    ,function(types, next){
      species.types = types;

      // Pokémon egg groups
      db.all('SELECT id, identifier FROM pokemon_egg_groups LEFT JOIN egg_groups ON egg_group_id = id WHERE species_id = ?'
        , [species.number], next);
    }
    ,function(rows, next){
      species.eggGroups = rows;

      // Pokémon species stats
      db.all('SELECT id, identifier, base_stat, effort FROM pokemon_stats JOIN stats ON stat_id = id WHERE pokemon_id = ?'
        , [raw.pokemon_id], next);
    }
    ,function(rows, next){
      species.effort = {};
      species.base = {};
      _.each(rows, function(row){
        species.effort[row.identifier] = row.effort;
        species.base[row.identifier] = row.base_stat;
      });

      // Evolution
      db.all('SELECT evolution_chain_id, evolved_species_id, evolution_triggers.identifier AS trigger, trigger_item_id, minimum_level, gender_id, locations.identifier AS location, held_item_id, time_of_day, known_move_id, minimum_happiness, minimum_beauty, relative_physical_stats AND party_species_id AND trade_species_id AND baby_trigger_item_id FROM pokemon_evolution JOIN pokemon_species ON evolved_species_id = pokemon_species.id JOIN evolution_triggers ON evolution_trigger_id = evolution_triggers.id JOIN evolution_chains ON evolution_chain_id = evolution_chains.id LEFT JOIN locations ON location_id = locations.id WHERE evolves_from_species_id = ?', [species.number], next);
    }
    ,function(rows, next){
      Object.defineProperty(species, 'evolutions', {
        enumerable: false
        ,value: rows
      });
      next();
    }
  ], function(err){
    if (err) return callback(err);
    speciesCache[nationalNumber] = speciesCache[nationalNumber] || {};
    speciesCache[nationalNumber][form] = species;
    callback(null, species);
  });
};

var speciesProto = {
  experience: function(n) {
    switch (this.growthRate) {
      // slow-then-very-fast
      case 5:
        if (n <= 50) {
          return Math.floor(n*n*n*(100-n)/50);
        } else if (n <= 68) {
          return Math.floor(n*n*n*(150-n)/100);
        } else if (n <= 98) {
          return Math.floor(n*n*n*(1911-10*n)/3/500);
        } else {
          return Math.floor(n*n*n*(160-n)/100);
        }
        break;
      // fast
      case 3:
        return Math.floor(4*n*n*n/5);
        break;
      // medium
      case 2:
        return n*n*n;
        break;
      // medium-slow
      case 4:
        return Math.floor(6*n*n*n/5-15*n*n+100*n-140);
        break;
      // slow
      case 1:
        return Math.floor(5*n*n*n/4);
        break;
      // fast-then-very-slow
      default:
        if (n <= 15) {
          return Math.floor(n*n*n*((n+1)/3+24)/50);
        } else if (n <= 36) {
          return Math.floor(n*n*n*(n+14)/50);
        } else {
          return Math.floor(n*n*n*(n/2+32)/50);
        }
        break;
    }
  }

  ,maxExperience: function(){
    return this.experience(100);
  }
};


// Get all Pokémon's forms
Species.allForms = function(callback){
  if (allFormsCache) return callback(null, _.clone(allFormsCache));

  db.all('SELECT pokemon_forms.id AS form_id, species_id, identifier, form_identifier, has_gender_differences FROM pokemon_forms LEFT JOIN pokemon ON pokemon_forms.pokemon_id = pokemon.id LEFT JOIN pokemon_species ON pokemon.species_id = pokemon_species.id', function(err, rows){
    if (err) return callback(err);

    allFormsCache = {};
    _.each(rows, function(row){
      if (!allFormsCache[row.species_id]) {
        allFormsCache[row.species_id] = {
          name: row.identifier
          ,hasGenderDifferences: row.has_gender_differences
          ,forms: {}
        };
      }
      if (row.form_identifier == 0) {
        row.form_identifier = '';
      }
      allFormsCache[row.species_id].forms[row.form_id] = row.form_identifier;
    });
    callback(null, allFormsCache);
  });
};

// Get the species id and form identifier by pokemon_id
Species.pokemonId = function(pokemonId, callback){
  if (pokemonIdCache[pokemonId])
    return callback(null, pokemonIdCache[pokemonId]);

  db.get('SELECT species_id, form_identifier FROM pokemon_forms JOIN pokemon ON pokemon_forms.pokemon_id = pokemon.id WHERE pokemon_id = ? AND pokemon_forms.is_default = 1', [pokemonId], function(err, row){
    if (err) return callback(err);
    if (!row) return new Error('MissingNo.');
    return callback(null, row);
  });
};

// Get the baby species of a Pokémon, without Insense or not
Species.getBabySpecies = function(pokemon, callback){
  if (!pokemon._inited) return callback(new Error('ERR_NOT_INITED'));

  // Special couples
  var couplePokemon = [[29, 32], [313, 314]];
  for (var i = 0; i < couplePokemon.length; i++) {
    if (_.contains(couplePokemon[i], pokemon.speciesNumber))
      return callback(null, _.sample(couplePokemon[i]));
  }

  db.get('SELECT pokemon_species.id AS id, baby_trigger_item_id FROM pokemon_species JOIN evolution_chains ON evolution_chains.id = evolution_chain_id WHERE evolution_chain_id = (SELECT evolution_chain_id FROM pokemon_species WHERE id = ?) AND evolves_from_species_id = 0', [pokemon.species.number], function(err, row){
    if (err) return callback(err);
    if (!row) return new Error('MissingNo.');

    // Insense
    if (row.baby_trigger_item_id == 0 || row.baby_trigger_item_id == pokemon.holdItemId) return callback(null, row.id);

    db.get('SELECT id FROM pokemon_species WHERE evolves_from_species_id = ?', [row.id], function(err, row){
      if (err) return callback(err);
      if (!row) return new Error('MissingNo.');

      callback(null, row.id);
    });
  });
};

// Bigger for compatibility.
Species.max = 1024;
// Total number of Pokémon species.
Species.total = 649;

module.exports = Species;