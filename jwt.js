const jwt = require("jsonwebtoken");

function getSignedJWT(user, email) {
  return jwt.sign(
    { user_id: user.id, email }, 
      process.env.TOKEN_KEY, 
    { expiresIn: "4380hr"}
    );
}


module.exports = { getSignedJWT };
