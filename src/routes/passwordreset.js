const express = require("express");
const cors = require("cors");
const { invalidateToken } = require("../database/tokenFunctions");
const { checkPasswordResetToken } = require("../middleware/checkToken");
const { changePassword } = require("../database/changePassword");
const router = express.Router();

var corsOptions = {
    origin: process.env.CLIENT_URL,
    optionsSuccessStatus: 200
  }

router.get('/:token', checkPasswordResetToken, async (req, res) => {    
    const token = req.params.token
    const email = req.body.email
    if (!token || !email) {
        res.status(400).send('Could not reset the password') 
    } else {
        try {                
            res.render('passwordreset.ejs', { email: req.body.email, token: token})
        } catch (error) {
            res.status(400).send(error)
        }
    }

})

router.post('/change/:token', checkPasswordResetToken, cors(corsOptions), async (req, res) => {    
    const token = req.params.token
    const newPassword = req.body.password
    const email = req.body.email
    await changePassword(email, newPassword)    
    await invalidateToken(token)        
    return res.status(200).send({ message: "Password Successfuly changed"})
})

module.exports = router;
