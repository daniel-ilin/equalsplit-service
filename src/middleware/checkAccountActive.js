const isUserActive = require("../database/isUserActive");

async function checkAccountActive(req, res, next) {
  try {
    let userIsActive = await isUserActive(req.body.email);
    if (userIsActive == true) {
      return next();
    } else {      
      res.status(403).send({ error: "You need to activate the user first" });
    }
  } catch (errorMessage) {    
    res.status(400).send({ error: `${errorMessage}` });
  }
}

module.exports = checkAccountActive;
