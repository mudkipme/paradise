var async = require('async');
var _ = require('underscore');
var mongoose = require('../paradise-db');
var Item = require('./item');
var io = require('../io');
var config = require('../../config.json');
var Schema = mongoose.Schema;

var needAccept = ['day-care', 'trade', 'battle'];
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
  relatedItemId:   Number,
  relatedNumber:   Number,
  createTime:      { type: Date, default: Date.now }
}, {
  toJSON: { virtuals: true, minimize: false }
});

MsgSchema.virtual('relatedItem').get(function(){
  return this._relatedItem;
});

var acceptMethods = {}, initJobs = {};

// Accept Day Care joining message
acceptMethods['day-care'] = function(cb){
  var me = this;
  if (!me.relatedDayCare || !me.relatedDayCare.trainerA)
    return cb(new Error('MSG_EXPIRED'));
  me.relatedDayCare.deposit(me.sender, me.senderPokemon, cb);
};

// Must be a valid day care request
initJobs['day-care'] = function(cb){
  var me = this;
  if (me.status == Status.waiting && me.relatedDayCare.depositError(me.sender, me.senderPokemon))
    return me.setExpire(cb);
  cb(null);
};

MsgSchema.methods.initData = function(callback){
  var me = this;
  if (me._inited) return callback(null, me);

  me.populate('sender receiver senderPokemon receiverPokemon relatedDayCare', function(err){
    if (err) return callback(err);

    var actions = [];

    me.relatedItemId &&
      actions.push(async.apply(Item, me.relatedItemId));
    me.relatedDayCare &&
      actions.push(me.relatedDayCare.initData.bind(me.relatedDayCare));
    me.senderPokemon &&
      actions.push(me.senderPokemon.initData.bind(me.senderPokemon));
    me.receiverPokemon &&
      actions.push(me.receiverPokemon.initData.bind(me.receiverPokemon));

    initJobs[me.type] && actions.push(initJobs[me.type].bind(me));

    async.series(actions, function(err, results){
      if (err) callback(err);
      me.relatedItemId && (me._relatedItem = results[0]);
      me._inited = true;
      callback(null, me);
    });
  });
};

// Accept a message
MsgSchema.methods.accept = function(callback){
  var me = this;
  if (this.status != Status.waiting || !acceptMethods[me.type])
    return callback(new Error('MSG_NOT_ACCEPTABLE'));

  me.read = true;
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
    if (err) {
      return me.setExpire(function(saveErr){
        callback(saveErr || err);
      });
    }
    callback(err);
  });
};

// Read a message
MsgSchema.methods.setRead = function(callback){
  this.read = true;
  async.series([
    this.initData.bind(this)
    ,this.save.bind(this)
  ], callback);
};

MsgSchema.methods.setExpire = function(callback){
  this.read = true;
  this.status = Status.expired;
  this.save(callback);
};

// Decline a message
MsgSchema.methods.decline = function(callback){
  if (this.status != Status.waiting)
    return callback(new Error('MSG_NO_ACTION'));

  this.read = true;
  this.status = Status.declined;

  async.series([
    this.initData.bind(this)
    ,this.save.bind(this)
    ,Msg.sendMsg.bind(Msg, {
      type: 'decline-' + this.type
      ,sender: this.receiver
      ,receiver: this.sender
      ,senderPokemon: this.receiverPokemon
      ,receiverPokemon: this.senderPokemon
      ,relatedDayCare: this.relatedDayCare
    })
  ], callback);
};

MsgSchema.statics.sendMsg = function(options, callback){
  if (!options.sender || !options.receiver)
    return callback(new Error('ERR_INVALID_PARAM'));
  var msg = new Msg(options);
  if (needAccept.indexOf(msg.type) > -1) {
    msg.status = Status.waiting;
  }
  async.series([
    msg.save.bind(msg)
    ,msg.initData.bind(msg)
  ], function(err){
    if (err) return callback(err);
    callback(null, msg);
    io.emitTrainer(options.receiver, 'msg:new', msg);
  });
};

MsgSchema.methods.toJSON = function(options){
  var res = mongoose.Document.prototype.toJSON.call(this, options);
  if (res.sender && res.sender.id == config.admin.defaultOT) {
    res.sender.name = '';
  }
  res.sender = _.pick(res.sender, 'id', 'name');
  res.receiver = _.pick(res.receiver, 'id', 'name');

  return res;
};

MsgSchema.index({ sender: 1, receiver: 1 });

var Msg = mongoose.model('Msg', MsgSchema);
module.exports = Msg;