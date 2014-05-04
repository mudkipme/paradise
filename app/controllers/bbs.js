var db = require('../forum-db');

var login = function(req, callback){
  var token = req.query.token,
    timestamp = Math.floor(Date.now() / 1000),
    userid = null;
  
  if (!req.query.token) return callback(new Error('TOKEN_NEEDED'));

  db.query(
    'SELECT * FROM {prefix}token JOIN {prefix}userlist USING (userid) WHERE app = 0 AND token = ?'
    ,req.query.token
    ,function(err, result){
      if (err) return callback(err);
      if (result.length == 0) return callback(new Error('TOKEN_INVALID'));
      if (result[0].expire_time < timestamp || result[0].in_use == 1)
        return callback(new Error('TOKEN_EXPIRED'));

      db.query(
        'UPDATE {prefix}token SET in_use = 1 WHERE app = 0 AND userid = ?'
        ,result[0].userid
        ,function(err){
          if (err) return callback(err);

          req.session.userid = result[0].userid;
          req.session.pwd = result[0].pwd;
          callback(null);
        });
    });
};

exports.login = function(req, res){
  login(req, function(err){
    if (err) return res.json(403, { error: err.message });
    
    res.redirect('/');
  });
};

exports.logout = function(req, res){
  delete req.session.userid;
  delete req.session.pwd;
  if (req.query.returnUrl) {
    res.redirect(req.query.returnUrl);  
  } else {
    res.send(204);
  }
};