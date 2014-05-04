/**
 * 52Poké Pokémon Paradise
 * 
 * @author  Mudkip <i@mudkip.me>
 * @link    http://paradise.52poke.com/
 * @license http://creativecommons.org/licenses/by-nc-sa/3.0/
 */

var express = require('express');
var path = require('path');
var i18n = require('i18next');
var _ = require('underscore');
var compress = require('compression');
var favicon = require('serve-favicon');
var logger = require('morgan');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');

var config = require('./config.json');
var sessionHandler = require('./app/session-handler');
var app = express();

i18n.init({
  resGetPath: path.join(__dirname, 'public', 'locales', '__lng__', '__ns__.json')
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
app.set('views', path.join(__dirname, 'app', 'views'));
app.set('view engine', 'ejs');
app.locals._ = _;
app.locals.config = config;

// middlewares
app.use(compress());
app.use(favicon(path.join(__dirname, 'public', 'images', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser(config.app.cookieSecret));
app.use(sessionHandler.session());
i18n.registerAppHelper(app);

if ('development' == app.get('env')) {
  app.use(require('less-middleware')(path.join(__dirname, 'public')));
}
app.use(express.static(path.join(__dirname, 'public')));

require('./app/routes')(app);

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

module.exports = app;