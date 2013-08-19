/**
 * Item RESTful Controller
 * @module controllers/item
 */

// dependencies
var async = require('async');
var Item = require('../models/item');
var Trainer = require('../models/trainer');
var _ = require('underscore');

// Get item info
exports.get = function(req, res){
  var itemId = parseInt(req.params.itemId);

  Item(itemId, function(err, item){
    if (err) return res.json(500, {error: err.message});

    res.json({
      id: item.id
      ,item: item
      ,number: req.trainer.hasItem(itemId)
    });
  });
};

// Gift items to other Trainer
exports.gift = function(req, res){
  var itemId = parseInt(req.params.itemId);
  var number = parseInt(req.body.number);
  var trainerName = req.body.trainer;

  if (!req.trainer.hasItem(itemId, number)) {
    return res.json(403, {error: 'NO_ENOUGH_ITEM_IN_BAG'});
  }

  if (trainerName == req.trainer.name) {
    return res.json(400, {error: 'CANNOT_GIFT_SELF'});
  }
  
  Trainer.findOne({ name: trainerName })
  .exec(function(err, trainer){
    if (err) return res.json(500, {error: err.message});
    if (!trainer) return res.json(404, {error: 'TRAINER_NOT_FOUND'});

    async.series([
      async.apply(Item, itemId)
      ,trainer.addItem.bind(trainer, itemId, number)
      ,req.trainer.removeItem.bind(req.trainer, itemId, number)
    ], function(err, results){
      if (err) return res.json(500, {error: err.message});
      res.json({
        id: item.id
        ,item: results[0]
        ,number: req.trainer.hasItem(itemId)
      });
    });
  });
};