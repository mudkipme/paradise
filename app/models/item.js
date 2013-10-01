/**
 * Item Model
 * @module models/item
 */

// dependencies
var async = require('async');
var _ = require('underscore');
var Type = require('./type');
var db = require('../common').baseData;

var itemCache = {};

// Get Item data from base database
var Item = function(identifier, cb) {
  if (itemCache[identifier]) return cb(null, itemCache[identifier]);

  var item = Object.create(itemProto), raw;

  async.waterfall([
    db.all.bind(db, 'SELECT * FROM items WHERE ' + (isNaN(identifier) ? 'identifier = ?' : 'id = ?')
        ,[identifier])
    ,function(rows, next){
      if (!rows.length) return next(new Error('ITEM_NOT_FOUND'));

      raw = rows[0];
      item.id = raw.id;
      item.name = raw.identifier;
      item.effects = [];

      db.all('SELECT effect_type, param_1, param_2, param_3, is_default FROM item_effects WHERE item_id = ?', [item.id], next);
    }
    ,function(rows, next){
      item.effects = _.sortBy(rows, 'is_default').reverse();
      item.usable = item._usableEffects().length != 0;

      db.all('SELECT item_pockets.identifier AS pocket FROM item_categories JOIN item_pockets ON item_categories.pocket_id = item_pockets.id WHERE item_categories.id = ?'
        ,[raw.category_id], next);
    }
    ,function(rows, next){
      if (!rows.length) return next(new Error('ITEM_CATEGORY_NOT_FOUND'));

      item.pocket = rows[0].pocket;
      item.holdable = _.contains(Item.holdablePockets, item.pocket);
      next();
    }
  ], function(err) {
    if (err) return cb(err);

    itemCache[item.id] = itemCache[item.name] = item;
    return cb(null, item);
  });
};

// Check if an item effect fits the condition
// options.typeId - the type id of attacking move
// options.critical - whether it's a critical hit
// options.special - whether it's a special attack
// options.attacker - attacker's battle stat
// options.defender - defender's battle stat
// options.order - round order
var parseCondition = function(pokemon, condition, options){
  options = options || {};
  var conditions = condition.split(';');

  var matches = _.map(conditions, function(con){
    var matchType = con.match(/^(type|damage)-(.+)/);
    var matchSpecies = con.match(/^species-(.+)/);

    if (matchType) {
      var types = matchType[2].split(',');
      var matchTypes = options.typeId
        ? [ Type.names[options.typeId] ]
        : _.pluck(pokemon.species.types, 'name');
      if (!_.intersection(types, matchType).length)
        return false;
    }

    if (matchSpecies) {
      var numbers = matchType[1].split(',');
      if (!_.contains(numbers, pokemon.species.number))
        return false;
    }

    if (con == 'critical' && !options.critical)
      return false;

    if (con == 'full-hp' && (!options.defender || options.defender.maxHp != options.defender.hp))
      return false;

    if (con == 'non-final' && pokemon.species.evolution.length)
      return false;
    
    if (con == 'physical' && options.special)
      return false;

    if (con == 'slow' && options.order == 1)
      return false;

    if (con == 'special' && !options.special)
      return false;
  });

  return _.every(matches);
};

// Item usage
var useEffect = {
  // Gain HP
  hp: function(pokemon, hp){
    hp = parseInt(hp);
    return pokemon.gainHP.bind(pokemon, hp);
  }

  // Gain Happiness
  ,happiness: function(pokemon, happiness, condition){
    var param = happiness.split(',');
    happiness = pokemon.happiness < 100 ? param[0]
      : (pokemon.happiness < 200 ? param[1] : param[2]);
    happiness = parseInt(happiness);

    // Type-specified Gummis
    if (condition) {
      condition = condition.split(';');
      var suitable = parseCondition(pokemon, condition[0]);
      if (!condition[1] && !suitable)
        return false;
      if (suitable && condition[1] == 'x2') {
        happiness *= 2;
      }
    }

    return pokemon.gainHappiness.bind(pokemon, happiness);
  }

  // Gain Base Stats
  ,effort: function(pokemon, stat, effort, condition){
    var matches, max;
    effort = parseInt(effort);
    if (matches = condition.match(/^max-(\d+)/)) {
      max = parseInt(matches[1]);
      if (pokemon.effort[stat] >= max) {
        return false;
      }
      if (pokemon.effort[stat] + effort > max) {
        effort = max - pokemon.effort[stat];
      }
    }
    return pokemon.gainEffort.bind(pokemon, _.object([stat], [effort]));
  }

  // Level up
  ,level: function(pokemon){
    return pokemon.levelUp.bind(pokemon);
  }

  // Evolve
  ,evolution: function(pokemon){
    return pokemon.evolve.bind(pokemon, 'use-item', {item: this});
  }

  // Change Forme
  ,forme: function(pokemon, formIdentifier){
    return pokemon.changeForme.bind(pokemon, formIdentifier);
  }
};

var itemProto = {
  _usableEffects: function(){
    return _.filter(this.effects, function(effect){
      return _.contains(Item.usableEffects, effect.effect_type);
    });
  }

  // Use an Item to Pokémon
  ,use: function(pokemon, callback){
    var me = this;

    if (!me.usable) return callback(new Error('ITEM_NOT_USABLE'));

    async.mapSeries(me._usableEffects(), function(effect, next){
      // Apply Item usages
      var fn = useEffect[effect.effect_type].call(me, pokemon,
               effect.param_1, effect.param_2, effect.param_3)
            || function(next){ next() };


      fn(function(err, events){
        // Fail to use if the Pokémon isn't suitable
        if (!_.compact(_.flatten(events)).length && effect.is_default)
          return next(new Error('ITEM_NOT_SUITABLE_TO_USE'));

        next(null, events);
      });
    }, function(err, results){
      if (err) return callback(err);
      callback(null, _.compact(_.flatten(results)));
    });
  }

  ,beforeBattle: function(pokemon, battleStat){
    var effects = _.where(this.effects, {effect_type: 'battle'});
    _.each(effects, function(effect){
      if (!parseCondition(pokemon, effect.param_3))
        return;

      // Attack boost
      if (effect.param_1 == 'attack' && effect.param_2.match(/^x/)) {
        battleStat.attack *= parseFloat(effect.param_2.substr(1));
      }

      // Critical stage
      if (effect.param_1 == 'critical') {
        battleStat.criticalStage += parseInt(effect.param_2.substr(6));
        if (battleStat.criticalStage > 4) {
          battleStat.criticalStage = 4;
        }
      }

      // Defense boost
      if (effect.param_1 == 'defense') {
        battleStat.defense *= parseFloat(effect.param_2.substr(1));
      }

      // Evasion
      if (effect.param_1 == 'evasion') {
        battleStat.evasion *= parseFloat(effect.param_2.substr(1));
      }

      // Special attack
      if (effect.param_1 == 'special-attack' && effect.param_2.match(/^x/)) {
        battleStat['special-attack'] *= parseFloat(effect.param_2.substr(1));
      }

      // Special defense
      if (effect.param_1 == 'special-defense') {
        battleStat['special-defense'] *= parseFloat(effect.param_2.substr(1));
      }

      // Speed
      if (effect.param_1 == 'speed') {
        battleStat['speed'] *= parseFloat(effect.param_2.substr(1));
      }
    });
  }

  ,accuracy: function(accuracy, order){
    var effect = _.findWhere(this.effects, {effect_type: 'battle', param_1: 'accuracy'});
    if (!effect || (effect.param_3 == 'slow' && order != 2))
      return accuracy;
    
    return accuracy * parseFloat(effect.param_2.substr(1));
  }

  // movement-first, movement-last
  ,movement: function(){
    var effect = _.find(this.effects, function(e){
      return e.effect_type == 'battle' && e.param_1.match(/^movement-/);
    });

    if (!effect) return 0;
    if (_.random(1, 100) > parseInt(effect.param_2)) return 0;

    if (effect.param_1 == 'movement-first')
      return 1;
    else
      return 2;
  }

  // power, shell-bell
  ,afterRoundAttacker: function(options){
    var effects = _.where(this.effects, {effect_type: 'battle'});
    var battleStat = options.attacker;

    _.each(effects, function(effect){
      if (!parseCondition(battleStat.pokemon, effect.param_3, options))
        return;

      if (effect.param_1 == 'power') {
        options.damage *= parseFloat(effect.param_2.substr(1));
      }

      if (effect.param_1 == 'shell-bell') {
        options.attacker.hp = options.attacker.hp + options.damage * 0.125;
        if (options.attacker.hp > options.attacker.maxHp) {
          options.attacker.hp = options.attacker.maxHp;
        }
      }
    });
  }

  // Boost attack/special attack after damage, endure, leftovers
  ,afterRoundDefender: function(options){
    var effects = _.where(this.effects, {effect_type: 'battle'});
    var battleStat = options.defender;

    _.each(effects, function(effect){
      if (!parseCondition(battleStat.pokemon, effect.param_3, options))
        return;

      if (effect.param_1 == 'attack' && effect.param_2.match(/^stage-/)) {
        battleStat.attackStage += parseInt(effect.param_2.substr(6));
        if (battleStat.attackStage > 6) {
          battleStat.attackStage = 6;
        }
      }

      if (effect.param_1 == 'endure' && _.random(0, 99) < parseInt(effect.param_2)
        && options.damage >= battleStat.hp) {
        options.damage = battleStat.hp - 1; 
      }

      if (effect.param_1 == 'special-attack' && effect.param_2.match(/^stage-/)) {
        battleStat.spAtkStage += parseInt(effect.param_2.substr(6));
        if (battleStat.spAtkStage > 6) {
          battleStat.spAtkStage = 6;
        }
      }

      if (effect.param_1 == 'leftovers') {
        battleStat.hp += battleStat.maxHp * parseFloat(effect.param_2);
      }
    });
  }

  ,effort: function(effort){
    var effects = _.findWhere(this.effects, {effect_type: 'after-battle'});
    if (!effect || !effect.param_1.match(/^effort/))
      return;
    var stat = effect.param_1.substr(7);

    if (!stat && effect.param_2 == 'x2') {
      _.each(effort, function(value, key){
        effort[key] *= 2;
      });
    }

    if (stat) {
      effort[stat] += parseInt(effect.param_2);
    }

    return;
  }
};

Item.usableEffects = ['hp', 'happiness', 'effort', 'level', 'evolution', 'forme'];
Item.holdablePockets = ['misc', 'medicine', 'pokeballs', 'berries', 'mail'];

module.exports = Item;