function checkNotAuthenticated(req, res, next) {
  console.log("Checking not authenticated!");
  if (req.isAuthenticated()) {    
    console.log("Bro you're authenticated!");
    return res.redirect("/login/success");
  } else {    
    console.log("Not authenticated");
    return next();
  }
}

module.exports = checkNotAuthenticated;
