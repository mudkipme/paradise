var router = require('express').Router();
var async = require('async');
var _ = require('underscore');
var Msg = require('../models/msg');
var io = require('../io');
var auth = require('../middlewares/authentication');

// middlewares
router.use(auth.login);
router.use(auth.trainer);

var msgAction = function(req, res, type){
  Msg.findOne({ _id: req.params.id }, function(err, msg){
    if (err) return res.json(500, {error: err.message});
    if (!msg) return res.json(404, {error: 'MSG_NOT_FOUND'});

    if (!req.trainer._id.equals(msg.receiver)
      && (type != 'initData' || !req.trainer._id.equals(msg.sender)))
      return res.json(403, {error: 'PERMISSION_DENIED'});

    msg[type](function(err){
      if (err) res.json(403, {error: err.message});
      res.json(msg);
    });
  });
};

// List one's messages
router.get('/', function(req, res){
  var skip = req.query.skip || 0;
  var limit = req.query.limit || 25;
  limit > 100 && (limit = 100);

  var condition = req.query.type == 'sent'
    ? {sender: req.trainer._id} : {receiver: req.trainer._id};

  async.series([
    Msg.find.bind(Msg, condition, null, {skip: skip, limit: limit, sort: 'read -createTime'})
    ,Msg.count.bind(Msg, condition)
    ,Msg.count.bind(Msg, _.extend({read: false}, condition))
  ], function(err, results){
    if (err) return res.json(500, { error: err.message });

    async.eachSeries(results[0], function(msg, next){
      msg.initData(next);
    }, function(err){
      if (err) return res.json(500, { error: err.message });
      res.json({
        msgs: results[0]
        ,total: results[1]
        ,unread: results[2]
      });
    });
  });
});

router.get('/:id', function(req, res){
  msgAction(req, res, 'initData');
});

// Read a message
router.post('/:id/read', function(req, res){
  msgAction(req, res, 'setRead');
  io.emit(req, 'msg:update');
});

// Accept a message
router.post('/:id/accept', function(req, res){
  msgAction(req, res, 'accept');
  io.emit(req, 'msg:update');
});

// Decline a message
router.post('/:id/decline', function(req, res){
  msgAction(req, res, 'decline');
  io.emit(req, 'msg:update');
});

module.exports = router;