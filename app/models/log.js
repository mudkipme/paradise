var mongoose = require('mongoose');
var async = require('async');
var _ = require('underscore');
var Pokemon = require('./pokemon');
var Item = require('./item');
var Schema = mongoose.Schema;

var logQueue = async.queue(function(attrs, callback){
  var create = function(){
    if (attrs.params.pokemon && attrs.params.pokemon.toObject) {
      attrs.params.pokemon = attrs.params.pokemon.toObject();
    }
    var log = new Log(attrs);
    log.save(callback);
  };

  if (attrs.key && attrs.trainer) {
    !_.isArray(attrs.key) && (attrs.key = [attrs.key]);
    var keys = _.Object(attrs.key, _.map(attrs.keys, function(){
      return 1;
    }));
    attrs.trainer.update({$inc: keys}, function(err){
      if (err) return callback(err);
      delete attrs.key;
      create();
    });
  } else {
    create();
  }
}, 1);

var LogSchema = new Schema({
  type:           String,
  trainer:        { type: Schema.Types.ObjectId, ref: 'Trainer' },
  relatedTrainer: { type: Schema.Types.ObjectId, ref: 'Trainer' },
  params:         Schema.Types.Mixed,
  createTime:     { type: Date, default: Date.now }
});

LogSchema.addLog = function(attrs){
  logQueue.push(attrs);
};

LogSchema.methods.initData = function(callback){
  var me = this, inits = [];

  if (me._inited) return callback(null, me);

  me.params = me.params || {};

  if (me.params.pokemon) {
    inits.push(function(next){
      Pokemon.initPokemon(me.params.pokemon, function(err, results){
        if (err) return next(err);
        _.extend(me.params.pokemon, results);
        next();
      });
    });
  }

  me.params.itemId && inits.push(async.apply(Item, me.params.itemId));
  async.series(inits, function(err){
    if (err) return callback(err);
    me._inited = true;
    callback(null, me);
  });
};

var Log = mongoose.model('Log', LogSchema);
module.exports = Log;