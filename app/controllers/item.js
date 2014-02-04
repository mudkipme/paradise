/**
 * Item RESTful Controller
 * @module controllers/item
 */

// dependencies
var async = require('async');
var _ = require('underscore');
var Item = require('../models/item');
var Trainer = require('../models/trainer');
var Msg = require('../models/msg');
var config = require('../../config.json');

// List all items in Poké Mart
exports.list = function(req, res){
  async.mapSeries(_.keys(config.pokemart), Item, function(err, result){
    if (err) return res.json(500, { error: err.message });

    res.json(_.map(result, function(item){
      return {
        id: item.id
        ,item: item
        ,price: config.pokemart[item.name]
        ,number: req.trainer.hasItem(item.id)
      };
    }));
  });
};

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

  if (number <= 0)
    return res.json(400, {error: 'INVAILD_ITEM_NUMBER'});

  if (!req.trainer.hasItem(itemId, number))
    return res.json(403, {error: 'NO_ENOUGH_ITEM_IN_BAG'});

  if (trainerName == req.trainer.name)
    return res.json(400, {error: 'CANNOT_GIFT_SELF'});
  
  Trainer.findOne({ name: trainerName })
  .exec(function(err, trainer){
    if (err) return res.json(500, {error: err.message});
    if (!trainer) return res.json(404, {error: 'TRAINER_NOT_FOUND'});

    async.series([
      async.apply(Item, itemId)
      ,trainer.addItem.bind(trainer, itemId, number)
      ,req.trainer.removeItem.bind(req.trainer, itemId, number)
      ,Msg.sendMsg.bind(Msg, {
        type: 'gift-item'
        ,sender: req.trainer
        ,receiver: trainer
        ,relatedItemId: itemId
        ,relatedNumber: number
      })
    ], function(err, results){
      if (err) return res.json(500, {error: err.message});
      res.json({
        id: itemId
        ,item: results[0]
        ,number: req.trainer.hasItem(itemId)
      });
      req.trainer.log('gift-item', {relatedTrainer: trainer, itemId: itemId, number: number});
    });
  });
};

// Buy items
exports.buy = function(req, res){
  var itemId = parseInt(req.params.itemId);
  var number = parseInt(req.body.number);

  if (number <= 0)
    return res.json(400, {error: 'INVAILD_ITEM_NUMBER'});

  Item(itemId, function(err, item){
    if (err) return res.json(500, {error: err.message});

    var requiredMoney = number * config.pokemart[item.name];
    var discount = 0;

    var doBuy = function(){
      if (!requiredMoney)
        return res.json(403, {error: 'CANNOT_BUY_THIS_ITEM'});

      if (req.member.money < requiredMoney)
        return res.json(403, {error: 'NO_ENOUGH_MONEY'});

      var actions = [
        req.trainer.addItem.bind(req.trainer, itemId, number)
        ,req.member.addMoney.bind(req.member, -requiredMoney)
      ];

      // Gift a Permier Ball when buying more than 10 Poké Balls
      if (item.name == 'poke-ball' && number >= 10) {
        actions.push(function(next){
          Item('premier-ball', function(err, premier){
            req.trainer.addItem(premier, 1, next);
          });
        });
      }

      async.series(actions, function(err, results){
        if (err) return res.json(500, {error: err.message});
        res.json({
          id: item.id
          ,item: item
          ,price: config.pokemart[item.name]
          ,number: req.trainer.hasItem(item.id)
          ,discount: discount
        });
        req.trainer.log('buy-item', {itemId: itemId, number: number});
      });
    };

    // Discount coupon
    if (req.trainer.hasItem(10019)) {
      req.member.getCheckIn(function(err, check){
        if (err) return res.json(500, {error: err.message});
        if (check.checked && check.postNum > 0) {
          discount = 1;
          requiredMoney = Math.round(requiredMoney / 2);
        } else {
          discount = 2;
        }
        doBuy();
      });
    } else {
      doBuy();
    }
  });
};
