var db = require('../common').baseData;

var Type = function(){};

// Cached type data
Type.cache = {};

// Get type data from base database
Type.get = function(id, callback){
  if (Type.cache[id])
    return callback(null, Type.cache[id]);

  var type = new Type();
  db.get("SELECT * FROM types WHERE id = ?", [id], function(err, row){
    if (err) return callback(err);
    if (!row) return callback(new Error('UNKNOWN_TYPE'));
    
    type._id = row.id;
    type._damageTo = {};
    type._damageBy = {};
    type.name = row.name;

    db.each(
      'SELECT * FROM type_efficacy WHERE damage_type_id = ? OR target_type_id = ?'
      ,[id, id]
      ,function(err, row){
        if (err) return callback(err);
        if (id == row.damage_type_id) {
          type._damageTo[row.target_type_id] = row.damage_factor;
        }
        if (id == row.target_type_id) {
          type._damageBy[row.damage_type_id] = row.damage_factor;
        }
      }
      ,function(){
        Type.cache[id] = type;
        callback(null, type);
      });
  });
};

/**
 * 计算被攻击命中的属性相性
 * @param  {Type} type   攻击方的技能的类型
 * @return {Number}    属性相性数值
 */
Type.prototype.damageBy = function(type) {
  return this._damageBy[type._id];
};

/**
 * 计算攻击命中对手的属性相性
 * @param  {Type} type   防御方的神奇宝贝的类型
 * @return {Number}    属性相性数值
 */
Type.prototype.damageTo = function(type) {
  return this._damageTo[type._id];
}

module.exports = Type;