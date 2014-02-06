var async = require('async');
var _ = require('underscore');
var Log = require('../models/log');

exports.list = function(req, res){
  var skip = req.query.skip || 0;
  var limit = req.query.limit || 25;
  limit > 100 && (limit = 100);

  var condition = { $or: [{trainer: req.trainer._id}, {relatedTrainer: req.trainer._id}], type: {$ne: 'use-item'} };

  async.series([
    Log.find.bind(Log, condition, null, {skip: skip, limit: limit, sort: '-createTime'})
    ,Log.count.bind(Log, condition)
  ], function(err, results){
    if (err) return res.json(500, { error: err.message });

    async.eachSeries(results[0], function(log, next){
      log.initData(next);
    }, function(err){
      if (err) return res.json(500, { error: err.message });
      res.json({
        logs: results[0]
        ,total: results[1]
      });
    });
  });
};

exports.get = function(req, res){
  Log.findOne({ _id: req.params.logId }, function(err, log){
    if (err) return res.json(500, {error: err.message});
    if (!log) return res.json(404, {error: 'LOG_NOT_FOUND'});

    log.initData(function(err){
      if (err) res.json(500, {error: err.message});
      res.json(log);
    });
  });
};