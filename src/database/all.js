const db = require("../../db");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

function getAllData(req, completion, errcompletion) {
  try {
    let responseJson = [];
    const userId = req.user.rows[0].id;
    db.query(
      "SELECT * FROM sessionusers WHERE userid = ($1);",
      [userId],
      (err, response) => {
        if (err) {
          errcompletion(err);
        } else {
          let sessions = response.rows;
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

            db.query(queryString, (err, response) => {
              if (err) {
                errcompletion(err);
              } else {
                responseJson = response.rows;
                console.log(responseJson);
                let finishedCounter = responseJson.length;
                console.log("Final counter value:");
                console.log(finishedCounter);
                let throughSessions = new Promise((resolveSessions, reject) => {
                  responseJson.forEach((element, index, array) => {
                    const sessionid = element.id;
                    getUsers(sessionid, (response) => {
                      console.log(finishedCounter);
                      finishedCounter--;
                      const sessionUsers = response.rows;
                      responseJson[index]["users"] = sessionUsers;
                      if (finishedCounter === 0) {
                        resolveSessions();
                      }
                    });
                  });
                });

                throughSessions.then(() => {
                  let finishedCounter = 0;
                  let referenceCounter = 0;
                  responseJson.forEach((element, index, array) => {
                    let sessionid = element.id;
                    const sessionUsers = element.users;
                    sessionUsers.forEach((element1, index1, array1) => {
                      referenceCounter++;
                      let userid = element1.userid;
                      getTransaction(sessionid, userid, (response) => {
                        finishedCounter++;
                        responseJson[index]["users"][index1]["transactions"] =
                          response.rows;
                        console.log(response.rows);
                        if (finishedCounter === referenceCounter) {
                          console.log(
                            "Finished iterating through sessions and users"
                          );
                          completion(responseJson);
                        }
                      });
                    });
                  });
                });
              }
            });
          } else {
            completion(responseJson);
          }
        }
      }
    );
  } catch {
    console.log("DEBUG: " + error);
    errcompletion(error);
  }
}

async function getTransaction(sessionid, userid, completion) {
  db.query(
    "SELECT * FROM transaction WHERE sessionid = ($1) AND ownerid = ($2);",
    [sessionid, userid],
    async (err, response) => {
      if (err) {
        completion(err);
      } else {
        completion(response);
      }
    }
  );
}

async function getUsers(sessionid, completion) {
  db.query(
    "SELECT userid, username FROM sessionusers WHERE sessionid = ($1);",
    [sessionid],
    (err, response) => {
      if (err) {
        completion(err);
      } else {
        completion(response);
        // const sessionUsers = response.rows
        // responseJson[index]["users"] = sessionUsers
      }
    }
  );
}

async function userOwnsSession(sessionid, currentuserid, completion) {
  try {
    const queryString = "SELECT ownerid FROM session WHERE id = ($1);";
    db.query(queryString, [sessionid], (err, response) => {
      if (err) {
        completion(err);
      } else {
        if (response.rows[0] && response.rows[0].ownerid === currentuserid) {
          completion(1);
        } else {
          completion(0);
        }
      }
    });
  } catch {
    return;
  }
}

async function userOwnsTransaction(transactionid, currentuserid, completion) {
  try {
    const queryString = "SELECT ownerid FROM transaction WHERE id = ($1);";
    db.query(queryString, [transactionid], (err, response) => {
      if (err) {
        completion(err);
      } else {
        if (response.rows[0] !== undefined) {
          if (response.rows[0].ownerid === currentuserid) {
            completion(1);
          } else {
            completion(0);
          }
        } else {
          completion(0);
        }
      }
    });
  } catch {
    completion(0);
  }
}

async function addUser(req) {
  let emailIsUsed = 0;
  try {
    const userFromEmail = await getUserByEmail(req.body.email);
    emailIsUsed = true;
  } catch (error) {
    emailIsUsed = false;
  }

  if (emailIsUsed === true) {
    throw new Error("Email already in use");
  } else {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const id = crypto.randomBytes(16).toString("hex");

    params = [id, req.body.email, req.body.name, hashedPassword];
    const response = await db.asyncQuery(
      "INSERT INTO users (id, email, name, password) VALUES ($1, $2, $3, $4) RETURNING *;",
      params
    );
    if (!response) {
      throw new Error("Can't add user");
    }
    return id;
  }
}

async function getUserByEmail(email) {
  const userFromEmail = await db.asyncQuery(
    "SELECT id, name FROM users WHERE email = ($1);",
    [email]
  );
  if (!userFromEmail.rows[0]) {
    throw new Error("User not found");
  }
  return userFromEmail.rows[0];
}

module.exports = {
  getAllData,
  getTransaction,
  getUsers,
  userOwnsSession,
  userOwnsTransaction,
  addUser,
  getUserByEmail,
};
