const express = require("express");
const router = express.Router();
const { getAllData, changeUserName, deleteUser } = require("../database/all");
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

router.put("/", async (req, res) => {
  try {
    let userid = req.body.userid
    let newName = req.body.newname
    await changeUserName(userid, newName)
    res.status(200).send({message: "User name sucessfully changed"})
  } catch {
    res.status(400).send({error: "Can't edit user"})
  }
})

router.delete("/", async (req, res) => {
  try {
    let userid = req.body.userid    
    await deleteUser(userid)
    res.status(200).send({message: "User sucessfully deleted"})
  } catch {
    res.status(400).send({error: "Can't delete user"})
  }
})

module.exports = router;
