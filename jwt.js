const jwt = require("jsonwebtoken");

function getRefreshToken(id, email) {
  return jwt.sign(
    { user: id, email }, 
      process.env.REFRESH_TOKEN_KEY, 
    { expiresIn: '26280hr'}
    );
}

function getAccessToken(id, email) {
  return jwt.sign(
    { user: id, email }, 
      process.env.ACCESS_TOKEN_KEY, 
    { expiresIn: '1hr'}
    );
}


module.exports = { getRefreshToken, getAccessToken };
