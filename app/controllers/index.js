exports.index = function(req, res){
  res.render('index', {me: null});
};

exports.defaults = function(req, res){
  if (!req.trainer) {
    res.redirect('/');
  } else {
    res.render('index');
  }
};