const db = require("../../db");

async function isUserActive(email) {  
  const isActive = await db.asyncQuery(
    "SELECT active FROM users WHERE email = ($1);",
    [email]
  );

  if (!isActive.rows[0]) {    
    throw new Error("User does not exist");
  }
  return isActive.rows[0].active;
}

module.exports = isUserActive;
