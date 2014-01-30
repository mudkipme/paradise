var crypto = require('crypto');
var time = require('time');
var db = require('../common').mysqlConnection;

var Member = function(){
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

  Object.defineProperty(me, 'logHash', {get: function(){
    var md5 = crypto.createHash('md5');
    return md5.update(me._rawUserInfo['pwd'] + me._rawUserInfo['userid'])
      .digest("hex").toString().substr(0, 6);
  }});
};

Member.getMember = function(user, byId, callback){
  var key = (byId === true) ? 'userid' : 'username';
  if (!callback) callback = byId;
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

Member.getLogin = function(req, callback){
  if (process.env.DEMO_USER)
    return Member.getMember(process.env.DEMO_USER, callback);

  if (!req.session.userid || !req.session.pwd)
    return callback(new Error('ERR_NOT_LOGINED'));

  db.query(
    db._('SELECT * FROM {prefix}userlist WHERE userid = ? AND pwd = ?')
    ,[req.session.userid, req.session.pwd]
    ,function(err, result){
      if (err) return callback(err);
      if (result.length == 0) return callback(new Error('ERR_NOT_LOGINED'));

      var member = new Member();
      member._rawUserInfo = result[0];
      callback(null, member);
    });
};

Member.prototype.getCheckIn = function(callback){
  var me = this;
  var today = new time.Date();
  today.setTimezone('Asia/Shanghai');
  today.setHours(0, 0, 0, 0);
  db.query(
    db._('SELECT * FROM {prefix}sign_history WHERE userid = ? AND sign_time >= ?')
    ,[me.userid, Math.floor(today.getTime() / 1000)]
    ,function(err, result){
      if (err) return callback(err);

      callback(null, {
        checked: result.length > 0
        ,postNum: result[0] && result[0].post_num
      });
    });
};

Member.prototype.addMoney = function(amount, callback){
  var me = this;

  db.query(
    db._('UPDATE {prefix}userlist SET money = money + ? WHERE userid = ?')
    ,[amount, me.userid]
    ,function(err) {
      if (err) return callback(err);

      db.query(
        db._('SELECT money FROM {prefix}userlist WHERE userid = ?')
        ,[me.userid]
        ,function(err, result) {
          if (err) return callback(err);
          if (!result.length) return callback(new Error('MEMBER_NOT_FOUND'));

          me._rawUserInfo['money'] = result[0].money;
          callback(null, me);
        });
    });
};

Member.prototype.addPoint = function(amount, callback){
  var me = this;

  db.query(
    db._('UPDATE {prefix}userlist SET point = point + ? WHERE userid = ?')
    ,[amount, me.userid]
    ,function(err){
      if (err) return callback(err);

      db.query(
        db._('SELECT point FROM {prefix}userlist WHERE userid = ?')
        ,[me.userid]
        ,function(err, result){
          if (err) return callback(err);
          if (!result.length) return callback(new Error('MEMBER_NOT_FOUND'));

          me._rawUserInfo['point'] = result[0].point;
          callback(null, me);
        });
    });
};

module.exports = Member;