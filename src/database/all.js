const db = require("../../db");
const bcrypt = require("bcrypt");

const crypto = require("crypto");
const {
  getSessionsForUser,
  buildSessionQueryString,
  getUsersForEachSession,
  getTransactionsForAllUsersInSessions,
} = require("./getAllDataFunctions");

async function getAllData(req, completion) {
  let responseJson = [];
  const userId = req.body.userid;
  const email = req.body.email;
  
  let activeUser = await getUserByEmail(email);
  const sessions = await getSessionsForUser(userId);
  if (!sessions || sessions.length == 0) {
    let finalResponse = { activeUser, sessions: responseJson };
    completion(finalResponse);
  }
  const queryString = buildSessionQueryString(sessions);
  let response = await db.asyncQuery(queryString);
  getUsersForEachSession(response.rows, (response) => {
    responseJson = response;
    getTransactionsForAllUsersInSessions(responseJson, (response) => {
      responseJson = response;
      let finalResponse = { activeUser, sessions: responseJson };
      completion(finalResponse);
    });
  });
}

async function userOwnsSession(sessionid, currentuserid) {
  const queryString = "SELECT ownerid FROM session WHERE id = ($1);";
  const response = await db.asyncQuery(queryString, [sessionid]);
  if (!response.rows[0]) {
    throw new Error("Server error");
  }
  if (response.rows[0].ownerid === currentuserid) {
    return true;
  } else {
    return false;
  }
}

async function userOwnsTransaction(transactionid, currentuserid) {
  const queryString = "SELECT ownerid FROM transaction WHERE id = ($1);";
  const response = await db.asyncQuery(queryString, [transactionid]);
  if (response.rows[0].ownerid === currentuserid) {
    return true;
  } else {
    return false;
  }
}

async function addUser(req) {
  let emailIsUsed = 0;
  try {
    await getUserByEmail(req.body.email);
    emailIsUsed = true;
  } catch (error) {
    emailIsUsed = false;
  }

  if (emailIsUsed === true) {
    throw new Error("Email already in use");
  } else {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);
    const id = crypto.randomBytes(16).toString("hex");
    const code = generateUserCode();

    const params = [id, req.body.email, req.body.name, hashedPassword, code];
    const response = await db.asyncQuery(
      "INSERT INTO users (id, email, name, password, code) VALUES ($1, $2, $3, $4, $5) RETURNING *;",
      params
    );
    if (!response) {
      throw new Error("Can't add user");
    }
    return { id: id };
  }
}

async function getUserByEmail(email) {
  const userFromEmail = await db.asyncQuery(
    "SELECT id, name, email FROM users WHERE email = ($1);",
    [email]
  );
  if (!userFromEmail.rows[0]) {
    throw new Error("User not found");
  }
  return userFromEmail.rows[0];
}

async function getSessionIdFromCode(code) {
  const queryStrnig = "SELECT id FROM session WHERE sessionCode = ($1);";
  const response = await db.asyncQuery(queryStrnig, [code]);
  if (!response.rows[0]) {
    throw new Error("Session not found");
  }
  return response.rows[0].id;
}

async function doesSessionOwnsUser(sessionid, userid) {
  const queryString =
    "SELECT COUNT(1) FROM sessionusers WHERE sessionid = ($1) and userid = ($2);";
  const response = await db.asyncQuery(queryString, [sessionid, userid]);
  if (response.rows[0].count > 0) {
    return true;
  } else {
    return false;
  }
}

async function addSession(sessionid, name, ownerid, sessionCode) {
  const queryString =
    "INSERT INTO session (id, name, ownerId, sessionCode) VALUES ($1, $2, $3, $4) RETURNING *";
  const response = await db.asyncQuery(queryString, [
    sessionid,
    name,
    ownerid,
    sessionCode,
  ]);
  if (!response) {
    return response;
  }
  return;
}

async function deleteSession(sessionid) {
  const queryString = "DELETE FROM session WHERE id = ($1);";
  await db.asyncQuery(queryString, [sessionid]);
  return;
}

async function renameSession(sessionid, name) {
  const queryString = "UPDATE session SET name = ($1) WHERE id = ($2);";
  await db.asyncQuery(queryString, [name, sessionid]);
}

function generateSessionCode() {
  let chars = "acdefhiklmnoqrstuvwxyz0123456789".split("");
  let result = "";
  for (let i = 0; i < 6; i++) {
    let x = Math.floor(Math.random() * chars.length);
    result += chars[x];
  }
  let upperCaseResult = result.toUpperCase();
  return upperCaseResult;
}

function generateUserCode() {
  let chars = "0123456789".split("");
  let result = "";
  for (let i = 0; i < 6; i++) {
    let x = Math.floor(Math.random() * chars.length);
    result += chars[x];
  }
  let upperCaseResult = result.toUpperCase();
  return upperCaseResult;
}

async function addUserToSession(sessionid, userid) {
  const queryString =
    "INSERT INTO SessionUsers (sessionId, userId) VALUES ($1, $2) RETURNING *";
  const response = await db.asyncQuery(queryString, [sessionid, userid]);
  return response;
}

async function removeUserFromSession(sessionid, userid) {
  const queryString =
    "DELETE FROM sessionusers WHERE sessionid = ($1) AND userid = ($2);";
  const response = await db.asyncQuery(queryString, [sessionid, userid]);
  return response;
}

async function removeAllUserTransactionsFromSessions(sessionid, userid) {
  const queryString =
    "DELETE FROM Transaction WHERE SessionId = ($1) AND OwnerId = ($2);";
  await db.asyncQuery(queryString, [sessionid, userid]);
  return;
}

async function isSessionEmpty(sessionid) {
  const queryString =
    "SELECT COUNT(1) FROM sessionusers WHERE sessionid = ($1);";
  const response = await db.asyncQuery(queryString, [sessionid]);
  if (response.rows[0] !== undefined && response.rows[0].count > 0) {
    return false;
  } else {
    return true;
  }
}

async function removeSession(sessionid) {
  const queryString = "DELETE FROM session WHERE id = ($1);";
  await db.asyncQuery(queryString, [sessionid]);
  return;
}

async function addTransaction(
  id,
  ownerid,
  sessionid,
  date,
  description,
  amount
) {
  let queryString =
    "INSERT INTO transaction (id, ownerid, sessionid, date, description, amount) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;";
  await db.asyncQuery(queryString, [
    id,
    ownerid,
    sessionid,
    date,
    description,
    amount,
  ]);
  return;
}

async function removeTransaction(transactionid) {
  let queryString = "DELETE FROM transaction WHERE id = ($1);";
  await db.asyncQuery(queryString, [transactionid]);
  return;
}

async function changeTransaction(description, amount, id) {
  let queryString =
    "UPDATE transaction SET description = ($1), amount = ($2) WHERE id = ($3) RETURNING *;";
  await db.asyncQuery(queryString, [description, amount, id]);
  return;
}

async function getSessionForTransaction(id) {
  let queryString = "SELECT SessionId FROM Transaction WHERE id = ($1);";
  let sessionid = await db.asyncQuery(queryString, [id]);
  return sessionid.rows[0].sessionid;
}

async function generateNewCodeForUser(email) {
  const code = generateUserCode();
  let queryString =
    "UPDATE Users SET Code = ($1) WHERE email = ($2) RETURNING *;";
  let user = await db.asyncQuery(queryString, [code, email]);
  return user;
}

async function getCodeForUserEmail(email) {
  let queryString = "SELECT Code FROM Users WHERE email = ($1);";
  let code = await db.asyncQuery(queryString, [email]);
  return code.rows[0].code;
}

async function activateUser(code) {
  let queryString =
    "UPDATE Users SET Active = true WHERE Code = ($1) RETURNING *;";
  let user = await db.asyncQuery(queryString, [code]);
  return user;
}

async function changeUserName(userid, newname) {
  let queryString = "UPDATE Users SET name = ($1) WHERE id = ($2) RETURNING *;";
  let user = await db.asyncQuery(queryString, [newname, userid]);
  return user;
}

async function deleteUser(userid) {
  let queryString = "DELETE FROM users WHERE id = ($1);";
  let user = await db.asyncQuery(queryString, [userid]);
  return user;
}

module.exports = {
  getAllData,
  deleteUser,
  userOwnsSession,
  userOwnsTransaction,
  addUser,
  getUserByEmail,
  getSessionIdFromCode,
  doesSessionOwnsUser,
  addUserToSession,
  generateSessionCode,
  addSession,
  deleteSession,
  renameSession,
  removeUserFromSession,
  removeAllUserTransactionsFromSessions,
  isSessionEmpty,
  removeSession,
  addTransaction,
  removeTransaction,
  changeTransaction,
  getSessionForTransaction,
  getCodeForUserEmail,
  activateUser,
  generateNewCodeForUser,
  changeUserName,
};
