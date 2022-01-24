const express = require("express");
const passport = require("passport");
const db = require("../../db");
const checkAuthenticated = require("../middleware/checkAuthenticated");
const checkNotAuthenticated = require("../middleware/checkNotAuthenticated");
const router = express.Router();


router.get("/success", checkAuthenticated, (req, res) => {
    db.query(
      "SELECT id, name FROM users WHERE id = ($1);",
      [req.user.rows[0].id],
      (err, result) => {
        if (err) {
          console.log(err);
        } else {
          res.status(200).send(result.rows[0]);
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