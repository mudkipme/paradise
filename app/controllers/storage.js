/**
 * Storage RESTful Controller
 * @module controllers/storage
 */

// dependencies
var async = require('async');
var _ = require('underscore');
var Pokemon = require('../models/pokemon');

// get the Pokemon collection in a storage box
exports.get = function(req, res){
  var boxId = parseInt(req.params.boxId);
  var storage = req.trainer.storage[boxId] || { name: '', wallpaper: '' };
  var storagePokemon = _.where(req.trainer.storagePokemon, { boxId: boxId });

  Pokemon.populate(storagePokemon, { path: 'pokemon' }, function(err){
    if (err) return res.json(500, {err: err.message});

    async.eachSeries(_.pluck(storagePokemon, 'pokemon'), function(pokemon, next){
      pokemon.initData(next);
    }, function(err){
      if (err) return res.json(500, {err: err.message});
      storagePokemon = _.map(storagePokemon, function(sp){
        return _.extend({ position: sp.position }, sp.pokemon.toJSON());
      });

      res.json(_.extend({ pokemon: storagePokemon, boxId: boxId }
        ,storage.toJSON ? storage.toJSON() : storage));
    });
  });
};