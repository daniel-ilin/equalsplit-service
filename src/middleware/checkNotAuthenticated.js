function checkNotAuthenticated(req, res, next) {
  const refreshToken = req.header("x-auth-token");
  if (!refreshToken) {
    return next();
  } else {
    return res.redirect("/login");
  }
}

module.exports = checkNotAuthenticated;
