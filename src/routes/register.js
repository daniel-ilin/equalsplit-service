const express = require("express");
const { addUser } = require("../database/all");
const checkNotAuthenticated = require("../middleware/checkNotAuthenticated");
const router = express.Router();

router.get("/", checkNotAuthenticated, (req, res) => {
  res.render("register.ejs");
});

router.post("/", checkNotAuthenticated, async (req, res) => {
  try {
    const id = await addUser(req);
    res.status(200).send({ id: id });
  } catch (error) {
    res.status(400).send({ error: `${error}` });
  }
});

module.exports = router;
