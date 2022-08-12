const express = require("express");
const { invalidateAllUserTokens } = require("../database/tokenFunctions");
const router = express.Router();

router.delete("/", async (req, res) => {
  try {    
    await invalidateAllUserTokens(req.body.userid);
    res
      .status(200)
      .send({ message: "Logged Out" });
  } catch {
    res.status(400).send({ message: "Could not logout" });
  }
});

module.exports = router;
