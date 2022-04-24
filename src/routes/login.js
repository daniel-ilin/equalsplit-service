const express = require("express");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const { getAccessToken, getRefreshToken } = require("../../jwt");
const { isTokenValid } = require("../database/tokenFunctions");
const checkAccountActive = require("../middleware/checkAccountActive");
const checkAuthenticated = require("../middleware/checkAuthenticated");
const checkNotAuthenticated = require("../middleware/checkNotAuthenticated");
const router = express.Router();

router.get("/success", checkAuthenticated, (req, res) => {
  const email = req.user.rows[0].email;
  const userid = req.user.rows[0].id;

  if (!userid || !email) {
    res.status(400).send({ error: "Could not find the user" });
  } else {
    try {
      const accessToken = getAccessToken(userid, email);
      const refreshToken = getRefreshToken(userid, email);  
      res
        .status(200)
        .json({ accessToken: accessToken, refreshToken: refreshToken });
    } catch {
      res.status(400).send({ error: "Could not find the user" });
    }
  }
});

router.get("/token", checkAccountActive, async (req, res) => {
  const refreshToken = req.header("x-auth-token");

  if (!refreshToken) {
    res.status(400).send({ error: "Token not found" });
    return;
  }

  if ((await isTokenValid(refreshToken)) === false) {
    res.status(401).send({ error: "Invalid refresh token" });
    return;
  }

  try {
    const decrypt = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_KEY);
    const { user, email } = decrypt;
    const accessToken = getAccessToken(user, email);
    res.status(200).send({ accessToken: accessToken });
    return;
  } catch {
    res.status(401).send({ error: "Invalid token" });
  }
});

// /login
router.get("/", checkAccountActive, checkNotAuthenticated, (req, res) => {
  res.status(400).send({ error: "User not logged in" });
});

router.post(
  "/",
  checkNotAuthenticated,  
  checkAccountActive,
  passport.authenticate("local", {
    successRedirect: "/login/success",
    failureRedirect: "/login",
    failureFlash: true,
  })
);

module.exports = router;
