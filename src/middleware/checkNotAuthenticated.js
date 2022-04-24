function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {    
    return res.status(400).send({ error: "You are already logged in"});
  } else {    
    return next();
  }
}

module.exports = checkNotAuthenticated;
