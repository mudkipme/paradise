/**
 * Item Model
 * @module models/item
 */

// dependencies
var async = require('async');
var db = require('../common').baseData;

var itemCache = {};

// Get Item data from base database
var Item = function(identifier, cb) {
  if (itemCache[identifier]) return cb(null, itemCache[identifier]);

  var item = Object.create(itemCache), raw;

  async.waterfall([
    function(next){
      db.all('SELECT * FROM items WHERE '
        + (isNaN(identifier) ? 'identifier = ?' : 'id = ?')
        , [identifier], next);
    }
    ,function(rows, next){
      if (!rows.length) return next(new Error('ITEM_NOT_FOUND'));

      raw = rows[0];
      item.id = raw.id;
      item.name = raw.identifier;

      db.all('SELECT item_flag_id FROM item_flag_map WHERE item_id = ?', [item.id], next);
    }
    ,function(rows, next){
      rows.forEach(function(row) {
        switch (row.item_flag_id) {
          case 1:
            item.countable = true;
            break;
          case 2:
            item.consumable = true;
            break;
          case 3:
            item.usableOverworld = true;
            break;
          case 4:
            item.usebleInBattle = true;
            break;
          case 5:
            item.holdable = true;
            break;
          case 7:
            item.holdableActive = true;
            break;
        }
      });

      db.all('SELECT item_categories.identifier AS category, item_pockets.identifier AS pocket FROM item_categories JOIN item_pockets ON item_categories.pocket_id = item_pockets.id WHERE item_categories.id = ?'
        ,[raw.category_id], next);
    }
    ,function(rows, next){
      if (!rows.length) return next(new Error('ITEM_CATEGORY_NOT_FOUND'));

      item.category = rows[0].category;
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
    if (!this.usableOverworld) return callback(new Error('ITEM_NOT_USABLE'));

    switch (this.category) {
      case 'evolution':
        break;
      case 'vitamins':
        break;
      case 'healing':
        break;
      default:
        callback(new Error('ITEM_NOT_USABLE'));
        break;
    }
  }
  ,hold: function(pokemon, battleStat, callback){
    if (!this.holdable) return callback(null, battleStat);

    switch (this.category) {
      case 'evolution':
        break;
      case 'held-items':
        break;
      case 'effort-training':
        break;
      case 'bad-held-items':
        break;
      case 'training':
        break;
      case 'plates':
        break;
      case 'species-specific':
        break;
      case 'type-enhancement':
        break;
      default:
        callback(null, battleStat);
        break;
    }
  }
};

module.exports = Item;