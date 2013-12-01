var async = require('async');
var _ = require('underscore');

var msgAction = function(req, res, type){
  Msg.findOne({ _id: req.params.msgId }, function(err, msg){
    if (err) return res.json(500, {error: err.message});
    if (!msg) return res.json(404, {error: 'MSG_NOT_FOUND'});

    if (req.trainer.equals(msg.receiver)
      && (!type == 'initData' || !req.trainer.equals(msg.sender)))
      res.json(403, {error: 'PERMISSION_DENIED'});

    msg[type](function(err){
      if (err) res.json(403, {error: err.message});
      res.json(msg);
    });
  });
};

// List one's messages
exports.list = function(req, res){
  var skip = req.query.skip || 0;
  var limit = req.query.limit || 25;
  limit > 100 && (limit = 100);

  var condition = req.query.type == 'sent'
    ? {receiver: req.trainer._id} : {sender: req.trainer._id};

  Msg.find(condition)
  .skip(skip).limit(limit)
  .exec(function(err, msgs){
    if (err) return res.json(500, { error: err.message });
    async.eachSeries(msgs, function(msg, next){
      msg.initData(next);
    }, function(err){
      if (err) return res.json(500, { error: err.message });
      res.json(msgs);
    })
  });
};

exports.get = function(req, res){
  msgAction(req, res, 'initData');
};

// Read a message
exports.read = function(req, res){
  msgAction(req, res, 'setRead');
};

// Accept a message
exports.accept = function(req, res){
  msgAction(req, res, 'accept');
};

// Decline a message
exports.decline = function(req, res){
  msgAction(req, res, 'decline');
};