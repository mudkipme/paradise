var mongoose = require('mongoose');
var async = require('async');
var _ = require('underscore');
var Pokemon = require('./pokemon');
var Item = require('./item');
var Schema = mongoose.Schema;

var logQueue = async.queue(function(attrs, callback){
  var create = function(){
    if (attrs.params.pokemon && attrs.params.pokemon.toObject) {
      var pokemon = attrs.params.pokemon.toObject({depopulate: true});
      if (!pokemon._id) {
        pokemon = attrs.params.pokemon.toObject();
      }
      attrs.params.pokemon = pokemon;
    }
    var log = new Log(attrs);
    log.save(callback);
  };

  if (attrs.key && attrs.trainer) {
    !_.isArray(attrs.key) && (attrs.key = [attrs.key]);
    var keys = _.object(attrs.key, _.map(attrs.keys, function(){
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

LogSchema.statics.addLog = function(attrs){
  logQueue.push(attrs);
};

LogSchema.methods.initData = function(callback){
  var me = this, inits = [];

  if (me._inited) return callback(null, me);

  me.params = me.params || {};
  inits.push(me.populate.bind(me, 'trainer relatedTrainer', 'name'));

  me.params.pokemon && inits.push(function(next){
    Pokemon.initPokemon(me.params.pokemon, function(err, results){
      if (err) return next(err);
      _.extend(me.params.pokemon, results);
      next();
    });
  });

  me.params.before && inits.push(function(next){
    Pokemon.initPokemon(me.params.before, function(err, results){
      if (err) return next(err);
      _.extend(me.params.before, results);
      next();
    });
  });

  me.params.itemId && inits.push(function(next){
    Item(me.params.itemId, function(err, item){
      if (err) return next(err);
      me.params.item = item;
      next();
    });
  });

  async.series(inits, function(err){
    if (err) return callback(err);
    me._inited = true;
    callback(null, me);
  });
};

LogSchema.methods.toJSON = function(options){
  var res = mongoose.Document.prototype.toJSON.call(this, options);
  res.trainer = _.pick(res.trainer, 'id', 'name');
  res.relatedTrainer && (res.relatedTrainer = _.pick(res.relatedTrainer, 'id', 'name'));
  return res;
};


LogSchema.index({ trainer: 1, relatedTrainer: 1 });

var Log = mongoose.model('Log', LogSchema);
module.exports = Log;