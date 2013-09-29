/**
 * Storage RESTful Controller
 * @module controllers/storage
 */

// dependencies
var async = require('async');
var _ = require('underscore');
var io = require('../io');
var Pokemon = require('../models/pokemon');

// Get the Pokémon collection in a storage box
exports.get = function(req, res){
  var boxId = parseInt(req.params.boxId);
  var storage = req.trainer.storage[boxId] || { name: '', wallpaper: '' };
  var storagePokemon = _.where(req.trainer.storagePokemon, { boxId: boxId });

  Pokemon.populate(storagePokemon, { path: 'pokemon' }, function(err){
    if (err) return res.json(500, {error: err.message});

    async.eachSeries(_.pluck(storagePokemon, 'pokemon'), function(pokemon, next){
      pokemon.initData(next);
    }, function(err){
      if (err) return res.json(500, {error: err.message});
      storagePokemon = _.map(storagePokemon, function(sp){
        return _.extend({ position: sp.position }, sp.pokemon.toJSON());
      });

      res.json(_.extend({ pokemon: storagePokemon, boxId: boxId }
        ,storage.toJSON ? storage.toJSON() : storage));
    });
  });
};

// Set the name or wallpaper of a storage box
exports.put = function(req, res){
  var boxId = parseInt(req.params.boxId);
  var storage = req.trainer.storage[boxId] || {name: '', wallpaper: ''};
  if (_.isString(req.body.wallpaper)) {
    storage.wallpaper = req.body.wallpaper;
  }
  if (_.isString(req.body.name)) {
    storage.name = req.body.name;
  }
  req.trainer.storage.set(boxId, storage);
  req.trainer.save(function(err){
    if (err) return res.json(500, { error: err.message });
    res.send(204);
    io.emit(req, 'storage:change', boxId, storage);
  });
};

// Move one Pokémon to another place
exports.move = function(req, res){
  var pokemonId = req.body.pokemon;
  var boxId = parseInt(req.body.boxId);
  var position = parseInt(req.body.position);
  if (boxId < 0 || boxId >= req.trainer.storageNum || position < 0 || position > 29)
    return res.json(400, { error: 'ILLEGAL_REQUEST_DATA' });

  if (_.isUndefined(req.body.position)) {
    position = _.find(_.range(0, 30), function(pos){
      return _.isUndefined(_.findWhere(req.trainer.storagePokemon, {boxId: boxId, position: pos}));
    });
  }

  if (_.isUndefined(position))
    return res.json(403, { error: 'NO_SLOT_FOUND' });

  // Find the Pokémon to move
  var src = _.find(req.trainer.storagePokemon, function(sp){
    return sp.pokemon.equals(pokemonId);
  });
  if (!src) return res.json(403, { error: 'PERMISSION_DENIED' });

  // Swap the Pokémon if there's another one
  var dst = _.findWhere(req.trainer.storagePokemon, {boxId: boxId, position: position});
  if (dst) {
    dst.boxId = src.boxId;
    dst.position = src.position;
  }

  src.boxId = boxId;
  src.position = position;

  req.trainer.save(function(err){
    if (err) return res.json(500, { error: err.message });
    res.send(204);

    Pokemon.populate(src, { path: 'pokemon' }, function(err){
      if (err) return;
      src.pokemon.initData(function(err){
        if (err) return;
        io.emit(req, 'storage:move', src.pokemon, {boxId: boxId, position: position});
      });
    });
  });
};

// Sort all Pokémon in storage
exports.sort = function(req, res){
  var sortBy = req.body.sortBy;

  var sortable = {
    meetDate: true
    ,level: false
    ,speciesNumber: true
  };

  if (!_.contains(_.keys(sortable), sortBy))
    return res.json(400, { error: 'ILLEGAL_REQUEST_DATA' });
  
  req.trainer.populate('storagePokemon.pokemon', function(err){
    if (err) res.json(500, { error: err.message });

    var sortedList = _.sortBy(req.trainer.storagePokemon, function(sp){
      return sp.pokemon[sortBy];
    });
    if (sortable[sortBy] === false) {
      sortedList.reverse();
    }

    _.each(sortedList, function(sp, index){
      sp.boxId = Math.floor(index / 30);
      sp.position = index % 30;
    });

    req.trainer.currentBox = 0;
    req.trainer.save(function(err){
      if (err) return res.json(500, { error: err.message });
      res.send(204);
      io.emit(req, 'storage:reset');
    });
  });
};