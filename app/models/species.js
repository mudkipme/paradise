var async = require('async');
var db = require('../common').baseData;
var Type = require('./type');

var Species = function(){};

// 神奇宝贝种族信息数据缓存，格式为 Species.cache[全国图鉴编号][型态标识]
Species.cache = {};

// 神奇宝贝种族总数，考虑到XY兼容，设定为较大值
Species.max = 1024;

/**
 * 获得神奇宝贝种族信息数据
 */
Species.get = function(nationalNumber, form, callback) {
  form = form || '0';
  if (Species.cache[nationalNumber] && Species.cache[nationalNumber][form])
    return callback(null, Species.cache[nationalNumber][form]);

  var species = new Species();
  var rawData = {};

  async.waterfall([
    // 从 base 库中读取元数据
    function(next){
      var sql = 'SELECT * FROM pokemon_forms JOIN pokemon'
        + ' ON pokemon_forms.pokemon_id = pokemon.id LEFT JOIN pokemon_species'
        + ' ON pokemon.species_id = pokemon_species.id WHERE species_id = ?';
      var params = [nationalNumber];
      if (form && form != '0') {
        sql += ' AND form_identifier = ?';
        params.push(form);
      } else {
        sql += ' AND pokemon_id = species_id';
      }

      db.get(sql, params, next);
    }
    ,function(row, next){
      if (!row) return next(new Error('MissingNo.'));

      rawData = row;

      species.number = row.species_id;
      species.name = row.identifier;
      species.genderRadio = row.gender_rate;
      species.growthRate = row.growth_rate_id;
      species.captureRate = row.capture_rate;
      species.formIdentifier = row.form_identifier || '';
      species.hatchTime = row.hatch_counter;
      species.height = row.height;
      species.weight = row.weight;
      species.baseHappiness = row.base_happiness;
      species.baseExperience = row.base_experience;

      next();
    }
    // 读取属性数据
    ,function(next){
      db.all('SELECT slot, type_id FROM pokemon_types WHERE pokemon_id = ?',
        [rawData.pokemon_id], next);
    }
    ,function(rows, next){
      if (!rows.length) return next(new Error('UNKNOWN_TYPE'));

      var index = 0;
      species.types = [];
      (function getType(){
        Type.get(rows[index].type_id, function(err, type){
          if (err) return next(err);
          species.types[rows[index].slot - 1] = type;

          if (++index == rows.length)
            return next();
          getType();
        });
      })();
    }
    // 读取蛋群数据
    ,function(next){
      db.all('SELECT id, identifier FROM pokemon_egg_groups LEFT JOIN '
        + 'egg_groups ON egg_group_id = id WHERE species_id = ?'
        , [species.number], next);
    }
    // 读取种族值、努力值数据
    ,function(rows, next){
      species.eggGroups = rows;
      db.all('SELECT id, identifier, base_stat, effort FROM pokemon_stats '
        + 'JOIN stats ON stat_id = id WHERE pokemon_id = ?'
        , [rawData.pokemon_id], next);
    }
    ,function(rows, next){
      species.effort = {};
      species.base = {};
      rows.forEach(function(row){
        species.effort[row.identifier] = row.effort;
        species.base[row.identifier] = row.base_stat;
      });
      next();
    }
  ], function(err){
    // 返回种族数据
    if (err) callback(err);
    Species.cache[nationalNumber] = Species.cache[nationalNumber] || {};
    Species.cache[nationalNumber][form] = species;
    callback(null, species);
  });
};

/**
 * 计算神奇宝贝在特定等级的经验值
 * @param  {Number} n 需要计算的等级
 * @return {Number}   在该等级的经验值
 */
Species.prototype.experience = function(n){
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
};

/**
 * 计算神奇宝贝的最大经验值
 * @return {Number} 神奇宝贝在等级100时的经验值
 */
Species.prototype.maxExperience = function(){
  return this.experience(100);
};

module.exports = Species;