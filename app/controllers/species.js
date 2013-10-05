var Species = require('../models/species');

exports.get = function(req, res){
  Species(req.params.speciesId, req.query.formIdentifier, function(err, species){
    if (err) return res.json(404, {error: err.message});
    res.json(species);
  });
};