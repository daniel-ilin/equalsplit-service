const express = require("express");
const crypto = require("crypto");
const { getTime } = require("../../dateSql");
const { addTransaction, userOwnsTransaction, removeTransaction, userOwnsSession, changeTransaction, getSessionForTransaction } = require("../database/all");
const checkAuthenticated = require("../middleware/checkAuthenticated");
const router = express.Router()


router.post("/", checkAuthenticated, async (req, res) => {
    try {
        const time = getTime()
        const id = crypto.randomBytes(16).toString("hex");    
        await addTransaction(id, req.user.rows[0].id, req.body.sessionid, time, req.body.description, req.body.amount)
        res.status(200).send({ message: 'Succesfully added transaction' })
    } catch (error) {
        res.status(400).send({ error: `${error}` })
    }
})

router.delete("/", checkAuthenticated, async (req, res) => {
    try {
        let userCanEdit = false
        const userIsTransactionOwner = await userOwnsTransaction(req.body.id, req.user.rows[0].id)
        if (userIsTransactionOwner === true) {
            userCanEdit = false
        }
        const sessionid = await getSessionForTransaction(req.body.id)
        const userIsSessionOwner = await userOwnsSession(sessionid, req.user.rows[0].id)
        if (userIsSessionOwner === true) {
            userCanEdit = true
        } 
        if (userCanEdit === false) {
            res.status(400).send({ error: "Error: User can't edit transaction" })
        } else {
            await removeTransaction(req.body.id)
            res.status(200).send({ message: 'Succesfully deleted transaction' })
        }        
    } catch (error) {
        res.status(400).send({ error: `${error}` })
    }
})

router.put("/", checkAuthenticated, async (req, res) => {
    try {
        let userCanEdit = false
        const userIsTransactionOwner = await userOwnsTransaction(req.body.id, req.user.rows[0].id)
        if (userIsTransactionOwner === true) {
            userCanEdit = true
        }
        const sessionid = await getSessionForTransaction(req.body.id)
        const userIsSessionOwner = await userOwnsSession(sessionid, req.user.rows[0].id)
        if (userIsSessionOwner === true) {
            userCanEdit = true
        }
        if (userCanEdit === false) {
            res.status(400).send({ error: "Error: User can't edit transaction" })
        }  else {
            await changeTransaction(req.body.description, req.body.amount, req.body.id)
            res.status(200).send({ message: 'Succesfully changed transaction' })
        }        
    } catch (error) {
        res.status(400).send({ error: `${error}` })
    }
})

module.exports = router