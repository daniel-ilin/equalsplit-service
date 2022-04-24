const express = require("express");
const { invalidateToken } = require("../database/tokenFunctions");
const router = express.Router();

router.delete("/", async (req, res) => {
  try {
    req.logOut();
    const token = req.header("x-auth-token");    
    await invalidateToken(token);
    res.status(200).send({ message: "Logged Out" });
  } catch {
    res.status(400).send({ message: "Could not logout" });  
  }  
});

module.exports = router;
