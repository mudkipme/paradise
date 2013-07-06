var sqlite3 = require('sqlite3').verbose();
var mysql = require('mysql');
var base = new sqlite3.Database(__dirname + '/database/base.sqlite3');
var config = require('../config.json');

var connection = mysql.createConnection({
  host: 'localhost',
  user: config.bbs.dbUser,
  password: config.bbs.dbPass,
  database: config.bbs.dbName
});

connection._ = function(sql){
  return sql.split('{prefix}').join(config.bbs.dbPrefix || '');
}

exports.mysqlConnection = connection;
exports.baseData = base;