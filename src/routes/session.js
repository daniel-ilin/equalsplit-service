const express = require('express');
const { getSessionIdFromCode, doesSessionOwnsUser, addUserToSession, generateSessionCode, addSession, userOwnsSession, deleteSession, renameSession, removeUserFromSession, removeAllUserTransactionsFromSessions, isSessionEmpty, removeSession } = require('../database/all');
const checkAuthenticated = require('../middleware/checkAuthenticated');
const crypto = require("crypto");

const router = express.Router()

router.post("/join", checkAuthenticated, async (req, res) => {
  try {
    const userId = req.user.rows[0].id;
    const code = req.body.sessionCode.toUpperCase();
    const sessionid = await getSessionIdFromCode(code)
    const sessionOwnsUser = await doesSessionOwnsUser(sessionid, userId)
    if (sessionOwnsUser === true) {
      res.status(400).send({ error: 'User already in the session' })
    }
    await addUserToSession(sessionid, userId)
    res.status(200).send({ sessionid: sessionid, usedid: userId })
  } catch (error){
    res.status(400).send({ error: `${error}` })
  }

})

router.post("/", checkAuthenticated, async (req, res) => {
  try {
    const ownerid = req.user.rows[0].id;
    const sessionid = crypto.randomBytes(16).toString("hex");
    const sessionCode = generateSessionCode()
    await addSession(sessionid, req.body.name, ownerid, sessionCode)
    await addUserToSession(sessionid, ownerid)
    res.status(200).send({ sessionid: sessionid, ownerid: ownerid, sessionCode: sessionCode })
  } catch (error) {
    res.status(400).send({ error: `${error}` })
  }
})
  
router.delete("/", checkAuthenticated, async (req, res) => {
  try {
    const sessionid = req.body.sessionid
    const userIsOwner = userOwnsSession(sessionid, req.user.rows[0].id)
    if (userIsOwner === false) {
    res.status(400).send({ error: `User does not have right to edit session` })    
    }
    await deleteSession(sessionid)
    res.status(200).send({ message: `Session removed` })
  } catch (error) {
    res.status(400).send({ error: `Error: ${error}` })
  }  
})
  
router.put("/", checkAuthenticated, async (req, res) => {
  try {
    const sessionid = req.body.sessionid
    const name = req.body.name
    const userIsOwner = userOwnsSession(sessionid, req.user.rows[0].id)
    if (userIsOwner === false) {
    res.res.status(400).send({ error: `User does not have right to edit session` })    
    }
    await renameSession(sessionid, name)
    res.status(200).send({ message: `Session renamed` })
  } catch (error) {
    res.status(400).send({ error: `Error: ${error}` })
  }  
})

router.delete("/user", checkAuthenticated, async (req, res) => {
  try {
    const sessionid = req.body.sessionid
    const userIsOwner = userOwnsSession(sessionid, req.user.rows[0].id)
    if (userIsOwner === false) {
    res.res.status(400).send({ error: `User does not have right to edit session` })    
    }
    await removeUserFromSession(sessionid, req.user.rows[0].id)
    await removeAllUserTransactionsFromSessions(sessionid, req.body.userid)
    const sessionEmpty = isSessionEmpty(sessionid)
    if (sessionEmpty == false) {
      return
    }
    await removeSession(sessionid)
  } catch (error) {
    res.status(400).send({ error: `Error: ${error}` })
  }
    
})

  module.exports = router