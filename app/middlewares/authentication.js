var async = require('async');
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

  Trainer
  .findOne({'name': req.member.username})
  .populate('party')
  .exec(function(err, trainer){
    if (err) return res.json(500, { error: err.message });
    if (!trainer) return next();

    trainer.initParty(function(err){
      if (err) return res.json(500, { error: err.message });
      req.trainer = trainer;
      next();
    });
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
  req.i18n.setLocale(locale);
  next();
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