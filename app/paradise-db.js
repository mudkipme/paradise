var mongoose = require('mongoose');
var config = require('../config.json');

mongoose.connect(config.database.url, {
  server: { socketOptions: { keepAlive: 1 } }
  ,replset: { socketOptions: { keepAlive: 1 } }
});

module.exports = mongoose;