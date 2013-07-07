/**
 * Item Model
 * @module models/item
 */

// dependencies
var async = require('async');
var db = require('../common').baseData;

var itemCache = {};

/**
 * Get Item data from base database
 * @param  {Number|String} identifier  Item ID or identifier
 */
var Item = function(identifier, cb) {
  if (itemCache[identifier]) return cb(itemCache[identifier]);

  var item = {};

  item.use = function(pokemon, cb) {
    if (!this.usableOverworld) return cb(new Error('ITEM_NOT_USABLE'));
  };

  async.waterfall([
    function(next) {
      db.get('SELECT * FROM items WHERE '
        + (isNaN(identifier) ? 'identifier = ?' : 'id = ?')
        , [identifier], next);
    }
    ,function(row, next) {
      if (!row) return next(new Error('ITEM_NOT_FOUND'));
      item.id = row.id;
      item.name = row.identifier;
      item.categoryId = row.categoryId;
      db.all('SELECT item_flag_id FROM item_flag_map WHERE item_id = ?', next);
    }
    ,function(rows, next) {
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
      next();
    }
  ], function(err) {
    if (err) return cb(err);
    return cb(null, item);
  });
};

module.exports = Item;