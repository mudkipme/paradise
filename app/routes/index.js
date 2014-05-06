var router = require('express').Router();
var async = require('async');
var auth = require('../middlewares/authentication');

// middlewares
router.use(auth.login);
router.use(auth.trainer);
router.use(auth.locale);

var displayPage = function(req, res){
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

router.get('/', displayPage);
router.get(/^\/(?!api)/, function(req, res){
  if (!req.trainer) return res.redirect('/');
  displayPage(req, res);
});

module.exports = router;