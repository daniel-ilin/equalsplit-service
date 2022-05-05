const express = require('express');
const { checkRefreshToken } = require('../middleware/checkToken');
const router = express.Router()

router.get('/', checkRefreshToken, async (req, res) => {
    res.status(200).send({message: 'Refresh token valid'})    
});

module.exports = router;