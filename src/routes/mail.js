const express = require('express');
const { sendMail } = require('../../mail-service');
const { getCodeForUserEmail, generateNewCodeForUser } = require('../database/all');
const router = express.Router()
const subject = 'Welcome to EqualSplit!'


router.post("/service", async (req, res) => {
    
    try {
        const email = req.body.email
        await generateNewCodeForUser(email)
        const code = await getCodeForUserEmail(email)
        let message = `Hello!\n
\n
Here is your activation code: \n
${code} \n
If you didn't register with Equal Split, please ignore this email. \n
\n
Best, \n
EqualSplit`
        await sendMail(email, subject, message, () => {
            res.status(200).send({ message: 'Check your email to activate the user!' })
        })
    } catch(error) {
        res.status(400).send({ error: `${error}` })
    }
  });

  module.exports = router