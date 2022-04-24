const express = require("express");
const crypto = require("crypto");
const { getTime } = require("../../dateSql");
const {
  addTransaction,
  userOwnsTransaction,
  removeTransaction,
  userOwnsSession,
  changeTransaction,
  getSessionForTransaction,
} = require("../database/all");
// const checkAuthenticated = require("../middleware/checkAuthenticated");
const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const time = getTime();
    const id = crypto.randomBytes(16).toString("hex");

    const sessionid = req.body.sessionid;
    const userid = req.body.targetid;
    const description = req.body.description;
    const amount = req.body.amount;

    await addTransaction(id, userid, sessionid, time, description, amount);
    res.status(200).send({ message: "Succesfully added transaction" });
  } catch (error) {
    res.status(400).send({ error: `${error}` });
  }
});

router.delete("/", async (req, res) => {
  try {
    let userCanEdit = false;
    const userIsTransactionOwner = await userOwnsTransaction(
      req.body.id,
      req.body.userid
    );
    if (userIsTransactionOwner === true) {
      userCanEdit = true;
    }
    const sessionid = await getSessionForTransaction(req.body.id);
    const userIsSessionOwner = await userOwnsSession(
      sessionid,
      req.body.userid
    );
    if (userIsSessionOwner === true) {
      userCanEdit = true;
    }
    if (userCanEdit === false) {
      res.status(400).send({ error: "Error: User can't edit transaction" });
    } else {
      await removeTransaction(req.body.id);
      res.status(200).send({ message: "Succesfully deleted transaction" });
    }
  } catch (error) {
    res.status(400).send({ error: `${error}` });
  }
});

router.put("/", async (req, res) => {
  try {

    const userid = req.body.userid

    let userCanEdit = false;
    const userIsTransactionOwner = await userOwnsTransaction(
      req.body.id,
      userid
    );
    if (userIsTransactionOwner === true) {
      userCanEdit = true;
    }
    const sessionid = await getSessionForTransaction(req.body.id);
    const userIsSessionOwner = await userOwnsSession(
      sessionid,
      userid
    );
    if (userIsSessionOwner === true) {
      userCanEdit = true;
    }
    if (userCanEdit === false) {
      res.status(400).send({ error: "Error: User can't edit transaction" });
    } else {
      await changeTransaction(
        req.body.description,
        req.body.amount,
        req.body.id
      );
      res.status(200).send({ message: "Succesfully changed transaction" });
    }
  } catch (error) {
    res.status(400).send({ error: `${error}` });
  }
});

module.exports = router;
