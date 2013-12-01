var mongoose = require('mongoose');
var async = require('async');
var _ = require('underscore');
var Schema = mongoose.Schema;

var Status = { normal: 0, waiting: 1, accepted: 2, refused: 3, ignored: 4, expired: 5 };

var MsgSchema = new Schema({
  type:            { type: String, default: 'default' },
  sender:          { type: Schema.Types.ObjectId, ref: 'Trainer' },
  receiver:        { type: Schema.Types.ObjectId, ref: 'Trainer' },
  content:         String,
  read:            { type: Boolean, default: false },
  status:          { type: Number, default: 0 },
  senderPokemon:   { type: Schema.Types.ObjectId, ref: 'Pokemon' },
  receiverPokemon: { type: Schema.Types.ObjectId, ref: 'Pokemon' },
  relatedDayCare:  { type: Schema.Types.ObjectId, ref: 'DayCare' },
  createTime:      Date
}, {
  toJSON: { virtuals: true, minimize: false }
});

MsgSchema.methods.initData = function(callback){
  var me = this;
  if (me._inited) return callback(null, me);

  var actions = [ me.populate.bind(me) ];

  me.relatedDayCare &&
    actions.push(me.relatedDayCare.initData.bind(me.relatedDayCare));
  me.senderPokemon &&
    actions.push(me.senderPokemon.initData.bind(me.senderPokemon));
  me.receiverPokemon &&
    actions.push(me.receiverPokemon.initData.bind(me.receiverPokemon));

  async.series(actions, function(err){
    if (err) callback(err);
    callback(null, me);
  });
};

// Accept a message
MsgSchema.methods.accept = function(callback){
  var me = this;

  var acceptMethods = {
    // Accept Day Care joining message
    'day-care': function(){
      if (!me.relatedDayCare || !me.relatedDayCare.trainerA)
        return cb(new Error('MSG_EXPIRED'));
      me.relatedDayCare.deposit(me.sender, me.senderPokemon, cb);
    }
  };
  
  if (!acceptMethods[me.type])
    return callback(new Error('MSG_NOT_ACCEPTABLE'));

  async.series([
    me.initData.bind(me)
    ,acceptMethods[me.type].bind(me)
    ,function(next){
      me.status = Status.accpeted;
      me.save(next);
    }
    ,Msg.sendMsg.bind(Msg, {
      type: 'accept-' + me.type
      ,sender: me.receiver
      ,receiver: me.sender
      ,senderPokemon: me.receiverPokemon
      ,receiverPokemon: me.senderPokemon
      ,relatedDayCare: me.relatedDayCare
    })
  ], function(err){
    if (err && err.message == 'MSG_EXPIRED') {
      me.status = Status.expired;
      return me.save(callback);
    }
    callback(err);
  });
};

MsgSchema.methods.ignore = function(callback){
  this.read = true;
  this.status = this.status && Status.ignored;
  this.save(callback);
};

MsgSchema.statics.sendMsg = function(options, callback){
  if (_.contains(needAccept, options.type)) {
    options.status = options.status || Status.waiting;
  }
  options.createTime = options.createTime || new Date();

  var msg = new Msg(options);
  msg.save(function(err){
    if (err) return callback(err);
    callback(null, msg);
  });
};

var Msg = mongoose.model('Msg', MsgSchema);
module.exports = Msg;
