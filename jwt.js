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

function getResetPasswordToken(email) {
  return jwt.sign(
    { email }, 
      process.env.PASSWORDRESET_TOKEN_KEY, 
    { expiresIn: '10m'}
    );
}


module.exports = { getRefreshToken, getAccessToken, getResetPasswordToken };
