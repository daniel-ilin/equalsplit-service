const express = require("express");
const router = express.Router();
const { getUserByEmail, getAllData } = require("../database/all");
// const verifyToken = require("../middleware/verifyToken.js");

router.get("/email", async (req, res) => {
  try {
    const userFromEmail = await getUserByEmail(req.body.email);
    res.status(200).send(userFromEmail);
  } catch (error) {    
    res.status(400).send({ error: "User Not Found" });
  }
});

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
