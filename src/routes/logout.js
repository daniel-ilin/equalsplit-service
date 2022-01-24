const express = require('express')
const router = express.Router()

router.delete("/", (req, res) => {
    req.logOut();
    res.status(200).send("User logged out");
  });

  module.exports = router