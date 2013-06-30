var index = require('./controllers/index');
var bbs = require('./controllers/bbs');
var trainer = require('./controllers/trainer');
var auth = require('./middlewares/auth');

module.exports = function(app){
  app.get('/bbs', bbs.login);
  app.get('/', [auth.login, auth.trainer, auth.locale], index.index);
  app.post('/api/trainer', [auth.login, auth.trainer], trainer.post);
};