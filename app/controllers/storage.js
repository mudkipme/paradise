/**
 * Storage RESTful Controller
 * @module controllers/storage
 */

// dependencies
var async = require('async');
var Pokemon = require('../models/pokemon');

exports.get = function(req, res){
  var boxId = parseInt(req.params.boxId);
  var storage = req.trainer.storage[boxId];

  if (!storage) return res.json({name: '', wallpaper: '', pokemon: []});

  Pokemon.populate(storage, {path: 'pokemon'}, function(err, storage){
    if (err) return res.json(500, {err: err.message});

    storage.initStorage(function(err){
      if (err) return res.json(500, {err: err.message});      
      res.json(storage);
    });
  });
};