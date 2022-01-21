function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect("/successlogin");
  } else {
    return next();
  }
}

module.exports = checkNotAuthenticated;
