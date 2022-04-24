function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {    
    return res.redirect("/login/success");
  } else {    
    return next();
  }
}

module.exports = checkNotAuthenticated;
