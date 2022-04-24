function checkAuthenticated(req, res, next) {
  console.log(req.body)
  if (req.isAuthenticated()) {
    return next();
  } else {    
    return res.redirect("/login");    
  }
}

module.exports = checkAuthenticated;
