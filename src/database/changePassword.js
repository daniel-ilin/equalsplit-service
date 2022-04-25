const db = require("../../db");
const bcrypt = require("bcrypt");

async function changePassword(email, password) {
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt);        

    const queryString = "UPDATE users SET password = ($1) WHERE email = ($2);"
    await db.asyncQuery(queryString,[hashedPassword, email])
}

module.exports = { changePassword }