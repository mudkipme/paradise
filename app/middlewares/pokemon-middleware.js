var Pokemon = require('../models/pokemon');

/**
 * Pokemon parameter
 * @param  {ObjectId}   pokemonId
 */
exports.pokemon = function(req, res, next, pokemonId){
  Pokemon.findOne({ _id: pokemonId })
  .populate('trainer', 'name')
  .exec(function(err, pokemon){
    if (err) return res.json(500, { error: err.message });
    if (!pokemon) return res.json(404, { error: 'POKEMON_NOT_FOUND' });
    
    pokemon.initData(function(err){
      if (err) return res.json(500, { error: err.message });
      req.pokemon = pokemon;
      return next();
    });
  });
};

/**
 * Limit request 
 */
exports.myPokemon = function(req, res, next){
  if (req.trainer && req.pokemon.trainer
    && req.pokemon.trainer._id.equals(req.trainer._id)) {
    next();
  } else {
    res.json(403, { error: 'PERMISSION_DENIED' });
  }
};