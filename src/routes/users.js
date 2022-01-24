const express = require("express");
const router = express.Router();
const { getUserByEmail, getAllData } = require("../database/all");
const checkAuthenticated = require("../middleware/checkAuthenticated");

router.get("/email", checkAuthenticated, async (req, res) => {
  try {
    const userFromEmail = await getUserByEmail(req.body.email);
    res.status(200).send(userFromEmail);
  } catch (error) {    
    res.status(400).send({ error: "User Not Found" });
  }
});

router.get("/", checkAuthenticated, async (req, res) => {
  try {
    getAllData(req, (response)=> {
      res.status(200).send(response)
    })    
  } catch (error) {
    res.status(400).send(`Error ${error}`)
  }  
});

module.exports = router;
