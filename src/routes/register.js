const express = require("express");
const { getSignedJWT } = require("../../jwt");
const { addUser } = require("../database/all");
const checkNotAuthenticated = require("../middleware/checkNotAuthenticated");
const router = express.Router();

router.get("/", checkNotAuthenticated, (req, res) => {
  res.render("register.ejs");
});

router.post("/", checkNotAuthenticated, async (req, res) => {
  try {    
    const user = await addUser(req);
    const email = req.body.email
    
    const token = getSignedJWT(user, email)
    
    user.token = token
    res.status(200).json(user);
  } catch (error) {
    res.status(400).send({ error: `${error}` });
  }
});

module.exports = router;
