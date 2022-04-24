const jwt = require("jsonwebtoken");
const { isTokenValid } = require("../database/tokenFunctions");

async function checkAccessToken(req, res, next) {
  const accessToken = req.header("x-auth-token");

  if (!accessToken) {
    res.status(401).send({ error: "Invalid access token" });
  } else if ((await isTokenValid(accessToken)) === false) {
    res.status(401).send({ error: "Invalid access token" });
  } else {
    try {
      const user = jwt.verify(accessToken, process.env.ACCESS_TOKEN_KEY);            
      req.body.email = user.email;
      req.body.userid = user.user;
      return next();
    } catch {
      res.status(401).send({ error: "Invalid access token" });
    }
  }
}

async function checkRefreshToken(req, res, next) {
  const refreshToken = req.header("x-auth-token");

  if (!refreshToken) {
    res.status(401).send({ error: "Invalid refresh token" });
  } else if ((await isTokenValid(refreshToken)) === false) {
    res.status(401).send({ error: "Invalid refresh token" });
  } else {
    try {
      const user = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_KEY);
      req.body.email = user.email;
      req.body.userid = user.user;
      return next();
    } catch {
      res.status(401).send({ error: "Invalid refresh token" });
    }
  }
}

module.exports = {checkAccessToken, checkRefreshToken};
