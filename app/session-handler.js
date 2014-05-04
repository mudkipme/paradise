var session = require('express-session');
var cookieParser = require('cookie-parser');
var config = require('../config.json');

// Session store
var RedisStore = require('connect-redis')(session);
var sessionStore = new RedisStore;
var key = 'connect.sid';

function findCookie(handshakeInput) {
  return handshakeInput.signedCookies && handshakeInput.signedCookies[key];
}

exports.session = function(){
  return session({key: 'connect.sid', store: sessionStore});
};

exports.io = function(handshakeData, callback){
  cookieParser(config.app.cookieSecret)(handshakeData, {}, function(err){
    if (err) return callback(err);
    sessionStore.get(findCookie(handshakeData), function(err, session){
      if (err) return callback(err);
      handshakeData.session = session || {};
      callback(null, handshakeData.session);
    });
  });
};