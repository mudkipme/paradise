var sqlite3 = require('sqlite3').verbose();
var mysql = require('mysql');
var mongoose = require('mongoose');
var express = require('express');
var config = require('../config.json');

// Session store
var RedisStore = require('connect-redis')(express);
var sessionStore = new RedisStore;

// MySQL connection
var mysqlConnection = mysql.createConnection({
  host: 'localhost',
  user: config.bbs.dbUser,
  password: config.bbs.dbPass,
  database: config.bbs.dbName
});

mysqlConnection._ = function(sql){
  return sql.split('{prefix}').join(config.bbs.dbPrefix || '');
};

// Mongoose connection
mongoose.connect(config.database.url, {
  server: { socketOptions: { keepAlive: 1 } }
  ,replset: { socketOptions: { keepAlive: 1 } }
});
mongoose.connection.on('error', console.error.bind(console, 'connection error:'));

exports.baseData = new sqlite3.Database(__dirname + '/database/base.sqlite3');
exports.mysqlConnection = mysqlConnection;
exports.mongoConnection = mongoose.connection;
exports.sessionStore = sessionStore;