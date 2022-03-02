const express = require("express");
const passport = require("passport");
const db = require("../../db");
const { getSignedJWT } = require("../../jwt");
const checkAuthenticated = require("../middleware/checkAuthenticated");
const checkNotAuthenticated = require("../middleware/checkNotAuthenticated");
const router = express.Router();

router.get("/success", checkAuthenticated, (req, res) => {
  
  const email = req.user.rows[0].email
  const token = getSignedJWT(req.user.rows[0], email)
  
  db.query(
      "SELECT id, name FROM users WHERE id = ($1);",
      [req.user.rows[0].id],
      (err, result) => {
        if (err) {
          console.log(err);
        } else {
          let user = result.rows[0]
          user.token = token
          res.status(200).json(user);
        }
      }
    );
  });
  
  // /login
  router.get("/", checkNotAuthenticated, (req, res) => {    
    res.status(401).send({ error: "User not logged in" });
  });
  
  router.post(
    "/",
    checkNotAuthenticated,
    passport.authenticate("local", {
      successRedirect: "/login/success",
      failureRedirect: "/login",
      failureFlash: true,
    })
  );

  module.exports = router