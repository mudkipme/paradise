var async = require('async');
var i18n = require('i18next');
var _ = require('underscore');
var sessionHandler = require('../session-handler');
var Member = require('../models/member.js');
var config = require('../../config.json');
var Trainer = require('../models/trainer.js');

/**
 * Login to the forum
 */
exports.login = function(req, res, next){
  Member.getLogin(req, function(err, member){
    if (err) {
      if (err.message == 'ERR_NOT_LOGINED' && !req.path.match(/^\/api/)) {
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
exports.trainer = function(req, res, next){
  if (!req.member) return next();

  Trainer.findByName(req.member.username, function(err, trainer){
    if (err) return res.json(500, { error: err.message });
    if (!trainer) return next();

    req.trainer = trainer;
    next();
  });
};

/**
 * Set the correct locale
 */
exports.locale = function(req, res, next){
  i18n.handle(req, res, function(){
    var locale;
    if (req.trainer && req.trainer.language) {
      locale = req.trainer.language;
    } else if (_.contains(['zh-hans', 'zh-hant', 'en'], req.cookies.i18next)) {
      locale = req.cookies.i18next;
    } else if (req.headers['accept-language']) {
      var hasHans = req.headers['accept-language'].match(/zh-(hans|cn|sg|my)/i);
      var hasHant = req.headers['accept-language'].match(/zh-(hant|tw|hk|mo)/i);
      if (hasHans) locale = 'zh-hans';
      else if (hasHant) locale = 'zh-hant';
    }
    if (locale) {
      req.lng = locale;
      req.i18n.lng = function(){ return locale };
    }
    next();
  });
};

// Socket.io authorization
exports.sio = function(data, next){
  sessionHandler.io(data, function(err, session){
    if (err) return next(err, false);

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