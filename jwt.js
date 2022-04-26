const jwt = require("jsonwebtoken");

function getRefreshToken(id, email) {
  return jwt.sign(
    { user: id, email }, 
      process.env.REFRESH_TOKEN_KEY, 
    { expiresIn: '26298hr'}
    );
}

function getAccessToken(id, email) {
  return jwt.sign(
    { user: id, email }, 
      process.env.ACCESS_TOKEN_KEY, 
    { expiresIn: '60m'}
    );
}

function getResetPasswordToken(id, email) {
  return jwt.sign(
    { user: id, email }, 
      process.env.PASSWORDRESET_TOKEN_KEY, 
    { expiresIn: '15m'}
    );
}


module.exports = { getRefreshToken, getAccessToken, getResetPasswordToken };
