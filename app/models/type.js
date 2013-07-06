var db = require('../common').baseData;

// Cached type data
var typeCache = {};

// Get type data from base database
var Type = function(id, callback){
  if (typeCache[id]) return callback(null, typeCache[id]);

  db.get("SELECT * FROM types WHERE id = ?", [id], function(err, row){
    if (err) return callback(err);
    if (!row) return callback(new Error('UNKNOWN_TYPE'));

    var type = {
      id: row.id,
      name: row.identifier
    };

    var damageBy = {}, damageTo = {};

    type.damageBy = function(attackType){
      return damageBy[attackType.id];
    };
    type.damateTo = function(targetType){
      return damateTo[targetType.id];
    }

    db.each(
      'SELECT * FROM type_efficacy WHERE damage_type_id = ? OR target_type_id = ?'
      ,[id, id]
      ,function(err, row){
        if (err) return callback(err);
        if (id == row.damage_type_id) {
          damageTo[row.target_type_id] = row.damage_factor;
        }
        if (id == row.target_type_id) {
          damageBy[row.damage_type_id] = row.damage_factor;
        }
      }
      ,function(){
        typeCache[id] = type;
        callback(null, type);
      });
  });
};

module.exports = Type;