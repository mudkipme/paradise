exports.index = function(req, res){
  if (!req.trainer) {
    res.render('welcome');
  } else {
    res.render('index');
  }
};

exports.defaults = function(req, res){
  if (!req.trainer) {
    res.redirct('/');
  } else {
    res.render('index');
  }
};