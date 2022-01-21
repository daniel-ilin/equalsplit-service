const express = require("express");
const router = express.Router();
const db = require("../../db");
const { getAllData, getUserByEmail } = require("../database/all");
const checkAuthenticated = require("../middleware/checkAuthenticated");

router.get("/email", checkAuthenticated, async (req, res) => {
  try {
    const userFromEmail = await getUserByEmail(req.body.email);
    res.status(200).send(userFromEmail);
  } catch (error) {
    console.log(`DEBUG: ${error}`);
    res.status(400).send({ error: "User Not Found" });
  }
});

router.get("/", checkAuthenticated, (req, res) => {
  getAllData(
    req,
    (data) => {
      console.log("DEBUG: Completion Called");
      res.status(200).send(data);
    },
    (err) => {
      console.log(err);
      res.status(400).send();
    }
  );
});

module.exports = router;
