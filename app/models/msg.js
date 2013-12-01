var mongoose = require('mongoose');
var async = require('async');
var _ = require('underscore');
var Schema = mongoose.Schema;

var Status = { normal: 0, waiting: 1, accepted: 2, declined: 3, expired: 4 };

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
  createTime:      { type: Date, default: Date.now }
}, {
  toJSON: { virtuals: true, minimize: false }
});

MsgSchema.virtual('needAccept').get(function(){
  var needAccept = ['day-care', 'trade', 'battle'];
  return _.contains(needAccept, this.type);
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

  me.status = Status.accepted;

  async.series([
    me.initData.bind(me)
    ,acceptMethods[me.type].bind(me)
    ,me.save.bind(me)
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

// Read a message
MsgSchema.methods.setRead = function(callback){
  if (this.needAccept)
    return callback(new Error('MSG_TAKE_ACTION'));
  this.read = true;
  this.save(callback);
};

// Decline a message
MsgSchema.methods.decline = function(callback){
  this.read = true;
  this.status = this.status && Status.declined;

  async.series([
    me.save.bind(me)
    ,Msg.sendMsg.bind(Msg, {
      type: 'decline-' + me.type
      ,sender: me.receiver
      ,receiver: me.sender
      ,senderPokemon: me.receiverPokemon
      ,receiverPokemon: me.senderPokemon
      ,relatedDayCare: me.relatedDayCare
    })
  ], callback);
};

MsgSchema.statics.sendMsg = function(options, callback){
  var msg = new Msg(options);
  if (msg.needAccept) {
    msg.status = options.status || Status.waiting;
  }
  msg.save(function(err){
    if (err) return callback(err);
    callback(null, msg);
  });
};

MsgSchema.index({ sender: 1, receiver: 1 });

var Msg = mongoose.model('Msg', MsgSchema);
module.exports = Msg;