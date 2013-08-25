var async = require('async');
var express = require('express');
var i18n = require('i18next');
var sessionStore = require('../common').sessionStore;
var Member = require('../models/member.js');
var config = require('../../config.json');
var Trainer = require('../models/trainer.js');

/**
 * Login to the forum
 */
exports.login = function(req, res, next) {
  Member.getLogin(req, function(err, member){
    if (err) {
      if (err.message == 'NOT_LOGINED' && !req.path.match(/^\/api/)) {
        return res.redirect(config.bbs.url);
      }
      return res.json(403, { error: err.message });
    }
    req.member = member;
    next();
  });
};

/**
 * Get trainer data
 */
exports.trainer = function(req, res, next) {
  if (!req.member) return next();

  Trainer.findByName(req.member.username, function(err, trainer){
    if (err) return res.json(500, { error: err.message });
    if (!trainer) return next();

    res.locals.me = req.trainer = trainer;
    next();
  });
};

/**
 * Set the correct locale
 */
exports.locale = function(req, res, next) {
  var locale = config.app.defaultLanguage;
  if (req.trainer && req.trainer.language) {
    locale = req.trainer.language;
  } else if (req.headers['accept-language']) {
    // In this particular project, only Chinese variant would be detected.
    // Otherwise fallback to defaultLanguage, like 52Poké Wiki.
    var hasHans = req.headers['accept-language'].match(/zh-(hans|cn|sg|my)/i);
    var hasHant = req.headers['accept-language'].match(/zh-(hant|tw|hk|mo)/i);
    if (hasHans && !hasHant) locale = 'zh-hans';
    if (!hasHans && hasHant) locale = 'zh-hant';
  }
  req.cookies.i18next = locale;
  i18n.handle(req, res, next);
};

/**
 * Limit request 
 */
exports.isSelf = function(req, res, next) {
  if (req.trainer && req.params.name == req.trainer.name) {
    next();
  } else {
    res.json(403, { error: 'PERMISSION_DENIED' });
  }
};


// Socket.io authorization
exports.sio = function(data, next){
  if (!data.headers.cookie) return next(null, false);

  express.cookieParser(config.app.cookieSecret)(data, {}, function(err){
    if (err) return next(err, false);
    data.cookie = data.signedCookies;
  });

  data.sessionID = data.cookie['connect.sid'];

  sessionStore.get(data.sessionID, function(err, session){
    if (err) return next(err, false);
    if (!session) return next(null, false);
    data.session = session;

    Member.getLogin(data, function(err, member){
      if (err) return next(err, false);
      if (!member) return next(null, false);
      
      data.member = member;
      Trainer.findOne({ name: member.username }, function(err, trainer){
        if (err) return next(err, false);
        if (!trainer) return next(null, false);

        data.trainer = trainer;
        next(null, true);
      });
    });
  });
};