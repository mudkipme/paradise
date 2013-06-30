var db = require('../common').baseData;

var Nature = {
  // Cached nature data
  cache: {}

  // Total number
  ,max: 25

  // Get nature data
  ,get: function(id, callback){
    if (Nature.cache[id]) {
      return callback(null, Nature.cache[id]);
    }

    db.get('SELECT natures.id AS id, natures.identifier AS identifier,'
      + ' s1.identifier AS decreased_stat, s2.identifier AS increased_stat'
      + ' FROM natures LEFT JOIN stats AS s1 ON natures.decreased_stat_id = s1.id'
      + ' LEFT JOIN stats AS s2 ON natures.increased_stat_id = s2.id'
      + ' WHERE natures.id = ?'
      , [id]
      , function(err, row){
        if (err) return callback(err);

        var nature = {
          id: row.id
          ,name: row.identifier
          ,decreasedStat: row.decreased_stat
          ,increasedStat: row.increased_stat
        };
        
        Nature.cache[id] = nature;
        callback(null, nature);
      });
  }
};

module.exports = Nature;