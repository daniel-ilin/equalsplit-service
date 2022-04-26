const db = require("../../db");

async function invalidateResetPasswordToken(token) {
  const queryString = "INSERT INTO BadTokens (token) VALUES ($1) RETURNING *";
  const response = await db.asyncQuery(queryString, [token]);
  return response;
}

async function invalidateAllUserTokens(userid) {
  const queryString = "DELETE FROM GoodTokens WHERE userid = ($1);"
  const response = await db.asyncQuery(queryString, [userid]);
  return response;
}

async function isTokenValid(token) {
  const queryString = "SELECT COUNT(1) FROM GoodTokens WHERE token = ($1);";
  const response = await db.asyncQuery(queryString, [token]);
  if (response.rows[0] !== undefined && response.rows[0].count > 0) {
    return true;
  } else {
    return false;
  }
}

async function isResetPasswordTokenValid(token) {
  const queryString = "SELECT COUNT(1) FROM BadTokens WHERE token = ($1);";
  const response = await db.asyncQuery(queryString, [token]);
  if (response.rows[0] !== undefined && response.rows[0].count > 0) {
    return false;
  } else {
    return true;
  }
}

async function saveRefreshToken(token, userid, expDate) {  
  const queryString = "INSERT INTO GoodTokens (token, expdate, userid) VALUES ($1, $2, $3) RETURNING *;";
  const response = await db.asyncQuery(queryString, [token, expDate, userid]);
  return response;
}

module.exports = { invalidateResetPasswordToken, isTokenValid, isResetPasswordTokenValid, saveRefreshToken, invalidateAllUserTokens };
