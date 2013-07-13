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
var mongoose = require('mongoose');
var i18n = require("i18next");
var config = require('./config.json');

var app = express();

i18n.init({
  resGetPath: 'public/locales/__lng__/__ns__.json'
  ,fallbackLng: false
  ,load: 'current'
  ,lowerCaseLng: true
  ,ns: {
    namespaces: ['app', 'pokemon'],
    defaultNs: 'app'
  }
});

// configurations
app.configure(function(){
  app.set('port', process.env.PORT || config.app.port);
  app.set('views', __dirname + '/app/views');
  app.set('view engine', 'ejs');
  app.use(express.compress());
  app.use(express.favicon(__dirname + '/public/images/favicon.ico'));
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser(config.app.cookieSecret));
  app.use(express.session());
  i18n.registerAppHelper(app);
  app.use(app.router);
});

app.configure('development', function(){
  app.use(require('less-middleware')({ src: __dirname + '/public' }));
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(express.errorHandler());
});

app.configure('production', function(){
  app.use(require('less-middleware')({ src: __dirname + '/dist', compress: true }));
  app.use(express.static(path.join(__dirname, 'dist')));
});

require('./app/routes')(app);

// Connect to MongoDB database
mongoose.connect(config.database.url);
mongoose.connection.on('error', console.error.bind(console, 'connection error:'));
mongoose.connection.once('open', function(){
  console.log('Connected to ' + config.database.url);
  http.createServer(app).listen(app.get('port'), function(){
    console.log('Paradise server listening on port ' + app.get('port'));
  });
});