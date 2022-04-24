const express = require("express");
const router = express.Router();
const { getAllData } = require("../database/all");
// const verifyToken = require("../middleware/verifyToken.js");

router.post("/", async (req, res) => {
  try {    
    getAllData(req, (response)=> {      
      res.status(200).send(response)
    })    
  } catch (error) {
    res.status(400).send(`Error ${error}`)
  }  
});

module.exports = router;
