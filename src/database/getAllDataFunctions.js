const db = require("../../db");

async function getSessionsForUser(userid) {
  let sessions = []
  const sessionsForUser = await db.asyncQuery(
    "SELECT * FROM sessionusers WHERE userid = ($1);",
    [userid]
  );
  sessions = sessionsForUser.rows
  return sessions;
}

async function getUsersForEachSession(sessions, completion) {
  let finishedCounter = sessions.length;
  let returnSessions = sessions;  
  sessions.forEach(async (element, index) => {
    const sessionid = element.id;
    const sessionUsers = await getUsers(sessionid)    
    finishedCounter--;    
    returnSessions[index]["users"] = sessionUsers;    
    if (finishedCounter === 0) {      
      completion(returnSessions)
    }
  });
}

async function getTransactionsForAllUsersInSessions(sessions, completion) {
  let finishedCounter = 0;
  let referenceCounter = 0;
  let returnSessions = sessions;

  sessions.forEach(async (element, index) => {
    let sessionid = element.id;
    const sessionUsers = element.users;

    sessionUsers.forEach(async (element1, index1) => {
      let userid = element1.userid;
      referenceCounter++;

      try {
        const transactions = await getTransaction(sessionid, userid);
        finishedCounter++;
        returnSessions[index]["users"][index1]["transactions"] = transactions;
        if (finishedCounter === referenceCounter) {
          completion(returnSessions)
        }
      } catch (error) {
        throw new Error(`${error}`);
      }
    });
  });
}

async function getUsers(sessionid) {
  const sessionUsers = await db.asyncQuery(
    "SELECT userid FROM sessionusers WHERE sessionid = ($1);",
    [sessionid]
  );  

  let users = [] 

  for (let user of sessionUsers.rows) {    
    const nameObject = await db.asyncQuery(
      "SELECT name FROM users WHERE id = ($1);",
      [user.userid]
    );  
    user.username = nameObject.rows[0].name 
    users.push(user)
  }
  return users;
}

async function getTransaction(sessionid, userid) {
  const transactions = await db.asyncQuery(
    "SELECT * FROM transaction WHERE sessionid = ($1) AND ownerid = ($2);",
    [sessionid, userid]
  );
  if (!transactions.rows) {
    throw new Error("Transactions not found");
  }
  return transactions.rows;
}

function buildSessionQueryString(sessions) {
  if (sessions.length > 0) {
    let queryString = "SELECT * FROM session WHERE id = ";
    sessions.forEach((element, index) => {
      if (index === 0) {
        const stringToConcat = "'" + element.sessionid + "'";
        queryString = queryString.concat(stringToConcat);
      } else {
        const stringToConcat = " OR id = '" + element.sessionid + "'";
        queryString = queryString.concat(stringToConcat);
      }
    });
    queryString = queryString.concat(";");
    return queryString;
  } else {
    return ";";
  }
}

module.exports = {
  getSessionsForUser,
  buildSessionQueryString,
  getUsersForEachSession,
  getTransactionsForAllUsersInSessions,
};
