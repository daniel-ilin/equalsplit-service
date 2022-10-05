const express = require("express");
const { activateUser } = require("../database/all");
const router = express.Router();

router.put("/", async (req, res) => {
  try {
    let code = req.body.code;
    let email = req.body.email;
    await activateUser(code, email);
    res.status(200).send({ message: "User activated" });
  } catch (error) {
    res.status(400).send({ error: "Could not activate the user" });
  }
});

module.exports = router;
