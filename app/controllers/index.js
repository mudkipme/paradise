exports.index = function(req, res){
  res.locals.me = res.locals.me || null;
  res.render('index');
};

exports.defaults = function(req, res){
  if (!req.trainer) {
    res.redirect('/');
  } else {
    res.render('index');
  }
};