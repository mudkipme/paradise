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

      db.all('SELECT effect_type, param_1, param_2, param_3, is_default FROM item_effects WHERE item_id = ?', [item.id], next);
    }
    ,function(rows, next){
      _.each(rows, function(row){
        item.effects.push(row);
      });

      item.usable = _.filter(item.effects, function(effect){
        return _.contains(Item.usableEffects, effect.effect_type);
      }).length != 0;

      db.all('SELECT item_pockets.identifier AS pocket FROM item_categories JOIN item_pockets ON item_categories.pocket_id = item_pockets.id WHERE item_categories.id = ?'
        ,[raw.category_id], next);
    }
    ,function(rows, next){
      if (!rows.length) return next(new Error('ITEM_CATEGORY_NOT_FOUND'));

      item.pocket = rows[0].pocket;
      next();
    }
  ], function(err) {
    if (err) return cb(err);

    itemCache[item.id] = itemCache[item.name] = item;
    return cb(null, item);
  });
};

var itemProto = {
  use: function(pokemon, callback){
    if (!this.usable) return callback(new Error('ITEM_NOT_USABLE'));

  }
  ,hold: function(pokemon, battleStat, callback){

  }
};

Item.usableEffects = ['hp', 'happiness', 'effort', 'level', 'evolution', 'forme'];

module.exports = Item;