var path = require('path');
var sqlite3 = require('sqlite3').verbose();
module.exports = new sqlite3.Database(path.join(__dirname, 'database', 'base.sqlite3'));