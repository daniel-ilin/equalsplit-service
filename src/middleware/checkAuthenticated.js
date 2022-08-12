function checkAuthenticated(req, res, next) {  
  const refreshToken = req.header("x-auth-token");
  if (!refreshToken) {
    return res.redirect("/login");
  } else {
    return next();
  }
}

module.exports = checkAuthenticated;
