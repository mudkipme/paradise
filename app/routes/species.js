var router = require('express').Router();
var Species = require('../models/species');

router.get('/:id', function(req, res){
  Species(req.params.id, req.query.formIdentifier, function(err, species){
    if (err) return res.json(404, {error: err.message});

    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.json(species);
  });
});

module.exports = router;