/**
 * 52Poké Pokémon Paradise
 * 
 * @author  Mudkip <i@mudkip.me>
 * @link    http://paradise.52poke.com/
 * @license http://creativecommons.org/licenses/by-nc-sa/3.0/
 */

// dependencies
var express = require('express');
var http = require('http');
var path = require('path');
var i18n = require('i18next');
var _ = require('underscore');
var config = require('./config.json');
var common = require('./app/common');

var app = express();
var server = http.createServer(app);

i18n.init({
  resGetPath: 'public/locales/__lng__/__ns__.json'
  ,preload: ['zh-hans', 'zh-hant', 'en']
  ,supportedLngs: ['zh-hans', 'zh-hant', 'en']
  ,fallbackLng: config.app.defaultLanguage
  ,load: 'current'
  ,lowerCaseLng: true
  ,detectLngFromHeaders: true
  ,detectLngFromPath: false
  ,useCookie: false
  ,ns: {
    namespaces: ['app', 'pokemon'],
    defaultNs: 'app'
  }
});

// configurations
app.set('port', process.env.PORT || config.app.port);
app.set('views', __dirname + '/app/views');
app.set('view engine', 'ejs');
app.locals({ _: _, config: config });
app.use(express.compress());
app.use(express.favicon(__dirname + '/public/images/favicon.ico'));
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser(config.app.cookieSecret));
app.use(express.session({ key: 'connect.sid', store: common.sessionStore }));
i18n.registerAppHelper(app);
app.use(app.router);

if ('development' == app.get('env')) {
  app.use(require('less-middleware')({ src: __dirname + '/public' }));
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(express.errorHandler());
}

if ('production' == app.get('env')) {
  app.use(require('less-middleware')({ src: __dirname + '/dist', compress: true }));
  app.use(express.static(path.join(__dirname, 'dist')));
}

require('./app/routes')(app);
require('./app/io').connect(server);

common.mongoConnection.once('open', function(){
  server.listen(app.get('port'), function(){
    console.log('Paradise server listening on port ' + app.get('port'));
  });
});