var db = require('../common').baseData;

var natureCache = {};

var Nature = function(id, callback){
  if (natureCache[id]) {
    return callback(null, natureCache[id]);
  }

  db.get('SELECT natures.id AS id, natures.identifier AS identifier, s1.identifier AS decreased_stat, s2.identifier AS increased_stat FROM natures LEFT JOIN stats AS s1 ON natures.decreased_stat_id = s1.id LEFT JOIN stats AS s2 ON natures.increased_stat_id = s2.id WHERE natures.id = ?'
    , [id]
    , function(err, row){
      if (err) return callback(err);
      if (!row) return callback(new Error('NATURE_NOT_FOUND'));

      var nature = {
        id: row.id
        ,name: row.identifier
        ,decreasedStat: row.decreased_stat
        ,increasedStat: row.increased_stat
      };

      if (nature.increasedStat == nature.decreasedStat) {
        nature.increasedStat = null;
        nature.decreasedStat = null;
      }
      
      natureCache[id] = nature;
      callback(null, nature);
    });
};

Nature.allNatures = function(callback){
  db.all('SELECT id, identifier AS name FROM natures', callback);
};

Nature.max = 25;

module.exports = Nature;