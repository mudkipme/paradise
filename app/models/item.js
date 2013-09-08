/**
 * Item Model
 * @module models/item
 */

// dependencies
var async = require('async');
var _ = require('underscore');
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

      db.all('SELECT effect_type, param_1, param_2, param_3, is_default FROM item_effects WHERE item_id = ? ORDER BY is_default DESC', [item.id], next);
    }
    ,function(rows, next){
      item.effects = rows;
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

var parseCondition = function(pokemon, condition){
  var matches;
  if (matches = condition.match(/^type-(\w+)/)) {
    if (_.contains(_.pluck(pokemon.species.types, 'name'), matches[1])) {
      return true;
    }
  }

  return false;
};

// Item usage
var useEffect = {
  // Gain HP
  hp: function(pokemon, hp){
    return pokemon.gainHP.bind(pokemon, hp);
  }

  // Gain Happiness
  ,happiness: function(pokemon, happiness, condition){
    var param = happiness.split(',');
    happiness = pokemon.happiness < 100 ? param[0]
      : (pokemon.happiness < 200 ? param[1] : param[2]);

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
    if (matches = condition.match(/^max-(\d+)/)) {
      max = parseInt(matches[1]);
      if (pokemon.effort[stat] >= max) {
        return false;
      }
      if (pokemon.effort[stat] + effort > max) {
        effort = max - pokemon.effort[stat];
      }
    }
    return pokemon.gainEffort.bind(pokemon, _.object(stat, effort));
  }

  // Level up
  ,level: function(pokemon){
    return pokemon.levelUp.bind(pokemon);
  }

  // Evolve
  ,evolution: function(pokemon){

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
        if (!_.flatten(events).length && effect.is_default)
          return next(new Error('ITEM_NOT_SUITABLE_TO_USE'));

        next(null, events);
      });
    }, function(err, results){
      if (err) return callback(err);
      callback(null, _.flatten(results));
    });
  }

  ,hold: function(pokemon, battleStat, callback){

  }
};

Item.usableEffects = ['hp', 'happiness', 'effort', 'level', 'evolution', 'forme'];
Item.holdablePockets = ['misc', 'medicine', 'pokeballs', 'berries', 'mail'];

module.exports = Item;