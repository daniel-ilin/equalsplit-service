const db = require("../../db");

async function invalidateToken(token) {
  const queryString = "INSERT INTO BadTokens (token) VALUES ($1) RETURNING *";
  const response = await db.asyncQuery(queryString, [token]);
  return response;
}

async function isTokenValid(token) {
  const queryString = "SELECT COUNT(1) FROM BadTokens WHERE token = ($1);";
  const response = await db.asyncQuery(queryString, [token]);
  if (response.rows[0] !== undefined && response.rows[0].count > 0) {
    return false;
  } else {
    return true;
  }
}

module.exports = { invalidateToken, isTokenValid };
