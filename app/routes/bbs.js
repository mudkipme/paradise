var router = require('express').Router();
var db = require('../forum-db');

router.get('/', function(req, res){
  var token = req.query.token,
    timestamp = Math.floor(Date.now() / 1000),
    userid = null;
  
  if (!req.query.token) return res.json(403, {error: 'TOKEN_NEEDED'});

  db.query(
    'SELECT * FROM {prefix}token JOIN {prefix}userlist USING (userid) WHERE app = 0 AND token = ?'
    ,req.query.token
    ,function(err, result){
      if (err) return res.json(500, {error: err.message});
      if (result.length == 0) return res.json(403, {error: 'TOKEN_INVALID'});
      if (result[0].expire_time < timestamp || result[0].in_use == 1)
        return res.json(403, {error: 'TOKEN_EXPIRED'});

      db.query(
        'UPDATE {prefix}token SET in_use = 1 WHERE app = 0 AND userid = ?'
        ,result[0].userid
        ,function(err){
          if (err) return callback(err);

          req.session.userid = result[0].userid;
          req.session.pwd = result[0].pwd;
          res.redirect('/');
        });
    });
});

router.get('/logout', function(req, res){
  delete req.session.userid;
  delete req.session.pwd;
  if (req.query.returnUrl) {
    res.redirect(req.query.returnUrl);  
  } else {
    res.send(204);
  }
});

module.exports = router;