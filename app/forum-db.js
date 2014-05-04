var mysql = require('mysql');
var _ = require('underscore');
var config = require('../config.json');

var pool = mysql.createPool({
  host: 'localhost',
  user: config.bbs.dbUser,
  password: config.bbs.dbPass,
  database: config.bbs.dbName
});

exports.pool = pool;

exports.query = function(sql, values, cb){
  sql = (sql + '').split('{prefix}').join(config.bbs.dbPrefix || '');

  if (_.isFunction(values)) {
    cb = values;
    values = undefined;
  }

  pool.getConnection(function(err, connection){
    if (err) return cb(err);

    connection.query(sql, values, function(err, rows, fields){
      cb(err, rows, fields);
      connection.release();
    });
  });
};