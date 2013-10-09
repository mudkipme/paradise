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

MsgSchema.methods.acceptDayCare = function(callback){
  var me = this;

  async.series([
    me.populate.bind(me, 'relatedDayCare sender senderPokemon')
    ,function(next){
      if (!me.relatedDayCare || !me.relatedDayCare.trainerA)
        return next(new Error('MSG_EXPIRED'));
      me.relatedDayCare.initData(next);
    }
    ,function(next){
      var found = _.find(me.sender.party, function(pokemon){
        return _.isEqual(me.senderPokemon._id, pokemon);
      });
      if (!found) return next(new Error('POKEMON_NOT_IN_PARTY'));
      me.senderPokemon.initData(next);
    }
    ,function(next){
      me.relatedDayCare.deposit(me.senderPokemon, next);
    }
    ,function(next){
      me.sender.party.pull(me.senderPokemon._id);
      me.sender.save(next);
    }
  ], function(err){
    if (err) callback(err);
    me.save(callback);
  });
};

MsgSchema.methods.accept = function(callback){
  var acceptMethods = {'day-care': 'acceptDayCare'};
  var me = this;
  
  if (!me.acceptMethods[me.type]) 
    return callback(new Error('MSG_NOT_ACCEPTABLE'));
  
  me.acceptMethods[me.type](function(err){
    me.read = true;
    if (err) {
      me.status = Status.expired;
      me.save(function(error){
        if (error) return callback(error);
        return callback(err);
      });
    }
    me.status = Status.accepted;
    async.series([
      me.save.bind(me)
      ,Msg.sendMsg.bind(Msg, {
        type: 'accept-' + me.type
        ,sender: me.receiver
        ,receiver: me.sender
        ,senderPokemon: me.receiverPokemon
        ,receiverPokemon: me.senderPokemon
        ,relatedDayCare: me.relatedDayCare
      })
    ], callback);
  });
};

MsgSchema.methods.ignore = function(callback){
  this.read = true;
  this.status = this.status && Status.ignored;
  this.save(callback);
};

MsgSchema.statics.sendMsg = function(options, callback){
  var needAccept = ['day-care', 'trade', 'battle'];
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
