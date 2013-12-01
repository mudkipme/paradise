var io = require('socket.io');
var _ = require('underscore');
var auth = require('./middlewares/authentication');

var sio;

exports.emit = function(req, eventName, data){
  if (!sio) return;

  var sockets = sio.sockets.in(req.trainer.id).except(req.get('X-Socket-ID'));
  sockets.emit.apply(sockets, _.toArray(arguments).slice(1));
};

exports.emitTrainer = function(trainer, eventName, data){
  if (!sio || !trainer) return;

  var sockets = sio.sockets.in(trainer.id || trainer);
  sockets.emit.apply(sockets, _.toArray(arguments).slice(1));
};

exports.connect = function(server){
  sio = io.listen(server);
  sio.set('authorization', auth.sio);
  sio.set('transports', ['websocket']);

  sio.sockets.on('connection', function(socket){
    var hs = socket.handshake;
    if (hs.trainer) {
      socket.join(hs.trainer.id);
    }
  });

  sio.set('log level', 1);

  exports.sio = sio;
  exports.sockets = sio.sockets;
};