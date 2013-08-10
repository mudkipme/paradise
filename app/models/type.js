var async = require('async');
var _ = require('underscore');
var db = require('../common').baseData;

// Cached type data
var typeCache = {};

// Get type data from base database
var Type = function(id, callback){
  if (typeCache[id]) return callback(null, typeCache[id]);

  async.series({
    type: function(next){
      db.get('SELECT * FROM types WHERE id = ?', [id], next);
    }
    ,efficacy: function(next){
      db.all('SELECT * FROM type_efficacy WHERE damage_type_id = ? OR target_type_id = ?'
        ,[id, id], next);
    }
  }, function(err, result){
    if (err) return callback(err);
    if (!result.type) return callback(new Error('UNKNOWN_TYPE'));

    var type = {
      id: result.type.id
      ,name: result.type.identifier
    };

    var damageBy = {}, damageTo = {};

    _.each(result.efficacy, function(row){
      if (id == row.damage_type_id) {
        damageTo[row.target_type_id] = row.damage_factor;
      }
      if (id == row.target_type_id) {
        damageBy[row.damage_type_id] = row.damage_factor;
      }
    });

    type.damageBy = function(attackType){
      return damageBy[attackType];
    }
    type.damageTo = function(targetType){
      return damageTo[targetType];
    }

    typeCache[id] = type;
    callback(null, type);
  });
};

module.exports = Type;