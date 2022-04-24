const express = require("express");
const { addUser } = require("../database/all");
const checkNotAuthenticated = require("../middleware/checkNotAuthenticated");
const router = express.Router();

router.get("/", checkNotAuthenticated, (req, res) => {
  res.render("register.ejs");
});

router.post("/", checkNotAuthenticated, async (req, res) => {
  try {    
    await addUser(req);
    const email = req.body.email        
    
    res.status(200).json({ message: `Registration successful ${email}` });
  } catch (error) {
    res.status(400).send({ error: `${error}` });
  }
});

module.exports = router;
