var async = require('async');

exports.index = function(req, res){

  var actions = [];
  if (req.trainer) {
    actions.push(req.trainer.unreadMsg.bind(req.trainer));
  }

  async.series(actions, function(err, results){
    if (err) return res.send(500, err.message);

    res.render('index', {
      me: req.trainer || null
      ,member: req.member
      ,unreadMsg: results[0] || 0
    });
  });
};

exports.defaults = function(req, res){
  if (!req.trainer) {
    res.redirect('/');
  } else {
    exports.index(req, res);
  }
};