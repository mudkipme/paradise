// routes
var index = require('./routes/index');
var bbs = require('./routes/bbs');
var trainer = require('./routes/trainer');
var pokemon = require('./routes/pokemon');
var item = require('./routes/item');
var storage = require('./routes/storage');
var admin = require('./routes/admin');
var encounter = require('./routes/encounter');
var species = require('./routes/species');
var daycare = require('./routes/daycare');
var msg = require('./routes/msg');
var log = require('./routes/log');

module.exports = function(app){
  app.use('/bbs', bbs);
  app.use('/api/trainer', trainer);
  app.use('/api/pokemon', pokemon);
  app.use('/api/item', item);
  app.use('/api/storage', storage);
  app.use('/api/encounter', encounter);
  app.use('/api/species', species);
  app.use('/api/daycare', daycare);
  app.use('/api/msg', msg);
  app.use('/api/admin', admin);
  app.use('/api/log', log);
  app.use('/', index);
};