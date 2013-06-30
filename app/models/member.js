var db = require('../common').mysqlConnection;

var Member = function() {
  var me = this;

  me._rawUserInfo = {};

  ['userid', 'username', 'point', 'money'].forEach(function(key){
    Object.defineProperty(me, key, {get: function(){
      return me._rawUserInfo[key];
    }});
  });

  Object.defineProperty(me, 'isAdmin', {get: function(){
    return me._rawUserInfo['ugnum'] == 0;
  }});
};

Member.getMember = function(user, byId, callback) {
  var key = byId ? 'userid' : 'username';
  db.query(
    db._('SELECT * FROM {prefix}userlist WHERE ' + key + ' = ?')
    ,[user]
    ,function(err, result){
      if (err) return callback(err);
      if (result.length == 0) return callback(new Error('MEMBER_NOT_FOUND'));

      var member = new Member();
      member._rawUserInfo = result[0];
      callback(null, member);
    });
};

Member.getLogin = function(req, callback) {
  if (!req.session.userid || !req.session.token)
    return callback(new Error('NOT_LOGINED'));

  db.query(
    db._('SELECT * FROM {prefix}token JOIN {prefix}userlist USING (userid)'
       + 'WHERE userid = ? AND token = ? AND app = 0 AND in_use = 1')
    ,[req.session.userid, req.session.token]
    ,function(err, result){
      if (err) return callback(err);
      if (result.length == 0) return callback(new Error('NOT_LOGINED'));

      var member = new Member();
      member._rawUserInfo = result[0];
      callback(null, member);
    });
};

Member.prototype.addMoney = function(amount, callback) {
  var me = this;

  db.query(
    db._('UPDATE {prefix}userlist SET money = money + ? WHERE userid = ?')
    ,[amount, this.userid]
    ,function(err) {
      if (err) return callback(err);

      db.query(
        db._('SELECT money FROM {prefix}userlist WHERE userid = ?')
        ,[this.userid]
        ,function(err, result) {
          if (err) return callback(err);
          if (!result.length) return callback(new Error('MEMBER_NOT_FOUND'));

          me._rawUserInfo['money'] = result[0].money;
          callback(null, me);
        });
    });
};

Member.prototype.addPoint = function(amount, callback){
  db.query(
    db._('UPDATE {prefix}userlist SET point = point + ? WHERE userid = ?')
    ,[amount, this.userid]
    ,function(err){
      if (err) return callback(err);

      db.query(
        db._('SELECT point FROM {prefix}userlist WHERE userid = ?')
        ,[this.userid]
        ,function(err, result){
          if (err) return callback(err);
          if (!result.length) return callback(new Error('MEMBER_NOT_FOUND'));

          me._rawUserInfo['point'] = result[0].point;
          callback(null, result[0].point);
        });
    });
};

module.exports = Member;