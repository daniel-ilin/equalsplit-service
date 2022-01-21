const express = require("express");
const app = express();
const passport = require("passport");
const flash = require("express-flash");

const session = require("express-session");
const MemoryStore = require("memorystore")(session);

const methodOverride = require("method-override");
const bodyParser = require("body-parser");

const crypto = require("crypto");

const currentDate = require("./dateSql");

const checkAuthenticated = require("./src/middleware/checkAuthenticated");
const checkNotAuthenticated = require("./src/middleware/checkNotAuthenticated");

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const initPassport = require("./passport-config");

initPassport(
  passport,
  (email, uponUserFetched) =>
    db.query(
      "SELECT * FROM users WHERE email = ($1);",
      [email],
      (err, response) => {
        uponUserFetched(response);
      }
    ),
  (id, uponUserFetched) =>
    db.query("SELECT * FROM users WHERE id = ($1);", [id], (err, response) => {
      uponUserFetched(response);
    })
);

app.set("view-engine", "ejs");
app.use(express.urlencoded({ extended: false }));
app.use(flash());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    store: new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    }),
    resave: false,
    saveUninitialized: false,
  })
);

app.use(bodyParser.json());

app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride("_method"));

const db = require("./db/index");

const { initDb } = require("./db-config");
initDb();

// ROUTES
app.use("/users", require("./src/routes/users"));
app.use("/register", require("./src/routes/register"));

// /successlogin
app.get("/successlogin", checkAuthenticated, (req, res) => {
  db.query(
    "SELECT id, name FROM users WHERE id = ($1);",
    [req.user.rows[0].id],
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.status(200).send(result.rows[0]);
      }
    }
  );
});

// /login
app.get("/login", checkNotAuthenticated, (req, res) => {
  res.status(401).send("User not logged in");
});

app.post(
  "/login",
  checkNotAuthenticated,
  passport.authenticate("local", {
    successRedirect: "/successlogin",
    failureRedirect: "/login",
    failureFlash: true,
  })
);

// /logout
app.delete("/logout", (req, res) => {
  req.logOut();
  res.status(200).send("User logged out");
});

// /session
app.get("/session", checkAuthenticated, (req, res) => {
  try {
    db.query(
      "SELECT * FROM sessionusers WHERE userid = ($1);",
      [req.user.rows[0].id],
      (err, response) => {
        if (err) {
          res.status(404).send("Could not retrive sessions");
        } else {
          let sessions = response.rows;
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
              res.status(400).send("Could not get session data");
            } else {
              res.status(200).send(response.rows);
            }
          });
        }
      }
    );
  } catch (error) {
    console.log(`DEBUG: ${error}`);
    res.status(400).send("Could not get user sessions");
  }
});

app.post("/session", checkAuthenticated, (req, res) => {
  try {
    const ownerid = req.user.rows[0].id;
    const id = crypto.randomBytes(16).toString("hex");
    const sessionCode = generateSessionCode();
    db.query(
      "INSERT INTO session (id, name, ownerId, sessionCode) VALUES ($1, $2, $3, $4) RETURNING *",
      [id, req.body.name, ownerid, sessionCode],
      (err) => {
        if (err) {
          res.status(400).send("Could not join session");
        } else {
          db.query(
            "SELECT name FROM users WHERE id = ($1);",
            [ownerid],
            (err, response) => {
              if (err) {
                console.log(err);
                res.status(400).send("Could not create session");
              } else {
                if (response.rows[0] != undefined) {
                  const username = response.rows[0].name;
                  db.query(
                    "INSERT INTO SessionUsers (sessionid, userid, username) VALUES ($1, $2, $3) RETURNING *",
                    [id, ownerid, username],
                    (err) => {
                      if (err) {
                        console.log("DEBUG:", err);
                        res.status(400).send("Could not create session");
                      } else {
                        console.log("DEBUG: Succesfuly created session");
                        res.status(200).send(id);
                      }
                    }
                  );
                } else {
                  res.status(400).send("Could not create session");
                }
              }
            }
          );
        }
      }
    );
  } catch {}
});

app.delete("/session", checkAuthenticated, (req, res) => {
  try {
    let currentUserOwner = false;
    let checkOwns = new Promise((resolve, reject) => {
      userOwnsSession(req.body.id, req.user.rows[0].id, (bool) => {
        currentUserOwner = bool;
        resolve();
      });
    }).then(() => {
      if (currentUserOwner == 1) {
        db.query(
          "DELETE FROM session WHERE id = ($1);",
          [req.body.id],
          (err) => {
            if (err) {
              res.status(400).send("Could not delete session");
            } else {
              res.status(200).send("Successfuly deleted session");
            }
          }
        );
      } else {
        res.status(400).send("Could not delete session");
      }
    });
  } catch {
    res.status(401).send("Could not delete session");
    console.log("DEBUG: Could not delete session");
  }
});

app.put("/session", checkAuthenticated, (req, res) => {
  try {
    let currentUserOwner = false;
    let checkOwns = new Promise((resolve, reject) => {
      userOwnsSession(req.body.id, req.user.rows[0].id, (bool) => {
        currentUserOwner = bool;
        resolve();
      });
    }).then(() => {
      if (currentUserOwner === 1) {
        const params = [req.body.name, req.body.id];
        db.query(
          "UPDATE session SET name = ($1) WHERE id = ($2);",
          params,
          (err) => {
            if (err) {
              res.status(400).send("Could not update session");
            } else {
              res.status(200).send("Sucessfuly updated session");
            }
          }
        );
      } else {
        res.status(400).send("Could not update session");
      }
    });
  } catch {
    console.log("DEBUG: Could not update session");
  }
});

// /sessionusers
app.get("/sessionusers", checkAuthenticated, (req, res) => {
  const sessionid = req.body.sessionid;
  try {
    db.query(
      "SELECT userid FROM sessionusers WHERE sessionid = ($1);",
      [sessionid],
      (err, response) => {
        const sessionUsers = response.rows;
        res.status(200).send(sessionUsers);
      }
    );
  } catch {
    res.status(404).send("Could not fetch session users");
  }
});

app.post("/sessionusers", checkAuthenticated, (req, res) => {
  try {
    let currentUserOwner = false;
    let checkOwns = new Promise((resolve, reject) => {
      userOwnsSession(req.body.sessionid, req.user.rows[0].id, (bool) => {
        currentUserOwner = bool;
        resolve();
      });
    }).then(() => {
      if (currentUserOwner === 1) {
        db.query(
          "SELECT COUNT(1) FROM sessionusers WHERE sessionid = ($1) and userid = ($2);",
          [req.body.sessionid, req.body.userid],
          (err, response) => {
            if (response.rows[0] === undefined) {
              res.status(400).send("Response undefined");
            } else {
              const sessionHasUserAlready = response.rows[0].count;
              if (sessionHasUserAlready > 0) {
                res.status(400).send("ERROR: session already hold this user");
              } else {
                db.query(
                  "SELECT name FROM users WHERE id = ($1)",
                  [req.body.userid],
                  (err, response) => {
                    if (err) {
                      console.log("DEBUG:", err);
                      res.status(400).send("Could not assign user to session");
                    } else {
                      if (response.rows[0] === undefined) {
                        res.status(400).send("Response undefined");
                      } else {
                        const username = response.rows[0].name;
                        db.query(
                          "INSERT INTO SessionUsers (sessionId, userId, username) VALUES ($1, $2, $3) RETURNING *",
                          [req.body.sessionid, req.body.userid, username],
                          (err) => {
                            if (err) {
                              console.log("DEBUG:", err);
                              res
                                .status(400)
                                .send("Could not assign user to session");
                            } else {
                              res.status(200).send("Added user to session");
                            }
                          }
                        );
                      }
                    }
                  }
                );
              }
            }
          }
        );
      } else {
        res.status(400).send("User has no permission to edit the session");
      }
    });
  } catch {
    res.status(400).send("Could not assign user to session");
  }
});

app.delete("/sessionusers", checkAuthenticated, (req, res) => {
  try {
    let currentUserOwner = false;
    let checkOwns = new Promise((resolve, reject) => {
      userOwnsSession(req.body.sessionid, req.user.rows[0].id, (bool) => {
        currentUserOwner = bool;
        resolve();
      });
    }).then(() => {
      if (currentUserOwner === 1) {
        db.query(
          "DELETE FROM sessionusers WHERE sessionid = ($1) AND userid = ($2);",
          [req.body.sessionid, req.body.userid],
          (err) => {
            if (err) {
              res.status(400).send("Could not remove user from session");
            } else {
              db.query(
                "DELETE FROM Transaction WHERE SessionId = ($1) AND OwnerId = ($2);",
                [req.body.sessionid, req.body.userid],
                (err) => {
                  if (err) {
                    res.status(400).send("Could not remove user from session");
                  } else {
                    db.query(
                      "SELECT COUNT(1) FROM sessionusers WHERE sessionid = ($1);",
                      [req.body.sessionid],
                      (err, response) => {
                        if (response.rows[0] !== undefined) {
                          const sessionHoldAnyUsers = response.rows[0].count;
                          if (
                            sessionHoldAnyUsers == 0 ||
                            req.user.rows[0].id == req.body.userid
                          ) {
                            db.query(
                              "DELETE FROM session WHERE id = ($1);",
                              [req.body.sessionid],
                              (err) => {
                                if (err) {
                                  res
                                    .status(400)
                                    .send("Could not clean up empty session");
                                } else {
                                  res
                                    .status(200)
                                    .send(
                                      "Removed user and cleaned up session"
                                    );
                                }
                              }
                            );
                          } else {
                            res.status(200).send("Removed user from session");
                          }
                        } else {
                          res
                            .status(200)
                            .send("Removed user and cleaned up session");
                        }
                      }
                    );
                  }
                }
              );
            }
          }
        );
      } else {
        res.status(400).send("Could not clean up empty session");
      }
    });
  } catch {
    res.status(400).send("Could not assign user to session");
  }
});

// /transactions
app.get("/transactions", checkAuthenticated, (req, res) => {
  db.query(
    "SELECT * FROM transaction WHERE sessionid = ($1) AND ownerid = ($2);",
    [req.body.sessionid, req.body.userid],
    (err, response) => {
      if (err) {
        res.status(400).send(err);
      } else {
        res.status(200).send(response.rows);
      }
    }
  );
});

app.post("/transactions", checkAuthenticated, (req, res) => {
  try {
    const timeSql = currentDate.currentTime;
    const id = crypto.randomBytes(16).toString("hex");
    const params = [
      id,
      req.user.rows[0].id,
      req.body.sessionid,
      timeSql,
      req.body.description,
      req.body.amount,
    ];
    db.query(
      "INSERT INTO transaction (id, ownerid, sessionid, date, description, amount) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;",
      params,
      (err, response) => {
        if (err) {
          console.log(err);
          res.status(400).send("Could not add transaction");
        } else {
          res.status(200).send("Posted transaction");
        }
      }
    );
  } catch {
    res.status(401).send("Could not add transaction");
    console.log("DEBUG: Could not post transaction");
  }
});

app.delete("/transactions", checkAuthenticated, (req, res) => {
  try {
    let currentUserId = req.user.rows[0].id;
    let currentUserOwner = false;
    let checkOwns = new Promise((resolve, reject) => {
      userOwnsSession(req.body.sessionid, currentUserId, (bool) => {
        currentUserOwner = bool;
        resolve();
      });
    }).then(() => {
      if (currentUserOwner === 1) {
        db.query(
          "DELETE FROM transaction WHERE id = ($1);",
          [req.body.id],
          (err, response) => {
            if (err) {
              res.status(400).send("Could not delete transaction");
            } else {
              res.status(200).send("Deleted transaction");
            }
          }
        );
      } else {
        res.status(400).send("Could not delete transaction");
      }
    });
  } catch {
    res.status(401).send("Could not delete transaction");
    console.log("DEBUG: Could not delete transaction");
  }
});

app.put("/transactions", checkAuthenticated, (req, res) => {
  try {
    let currentUserOwner = false;
    let checkOwns = new Promise((resolve, reject) => {
      userOwnsTransaction(req.body.id, req.user.rows[0].id, (bool) => {
        currentUserOwner = bool;
        resolve();
      });
    }).then(() => {
      if (currentUserOwner === 1) {
        db.query(
          "SELECT ownerid FROM transaction WHERE id = ($1);",
          [req.body.id],
          (err, response) => {
            if (err) {
              res.status(400).send(err);
            } else {
              if (response.rows[0] === undefined) {
                res.status(400).send("Response undefined");
              } else {
                if (response.rows[0].ownerid === req.user.rows[0].id) {
                  const params = [
                    req.body.description,
                    req.body.amount,
                    req.body.id,
                  ];
                  db.query(
                    "UPDATE transaction SET description = ($1), amount = ($2) WHERE id = ($3) RETURNING *;",
                    params,
                    (err, response) => {
                      if (err) {
                        res.status(401).send("Could not update transaction");
                      } else {
                        res.status(200).send("Edited transaction");
                      }
                    }
                  );
                } else {
                  res
                    .status(400)
                    .send("Transactions can only be edited by their owners");
                }
              }
            }
          }
        );
      } else {
        res.status(400).send("User has no permission to edit the session");
      }
    });
  } catch {
    res.status(400).send("Could not assign user to session");
  }
});

// /joinsessions
app.post("/joinsession", checkAuthenticated, (req, res) => {
  let code = req.body.sessionCode.toUpperCase();
  db.query(
    "SELECT id FROM session WHERE sessionCode = ($1);",
    [code],
    (err, response) => {
      try {
        if (err) {
          res.status(400).send("Could not find session with that code");
        } else {
          if (response.rows[0] === undefined) {
            res.status(400).send("Response undefined");
          } else {
            const sessionid = response.rows[0].id;
            const userId = req.user.rows[0].id;
            db.query(
              "SELECT COUNT(1) FROM sessionusers WHERE sessionid = ($1) and userid = ($2);",
              [sessionid, userId],
              (err, response) => {
                if (err) {
                  res.status(400).send("Could not assign user to session");
                } else {
                  if (response.rows[0] === undefined) {
                    res.status(400).send("Response undefined");
                  } else {
                    const sessionHasUserAlready = response.rows[0].count;
                    if (sessionHasUserAlready > 0) {
                      res
                        .status(400)
                        .send("ERROR: session already hold this user");
                    } else {
                      db.query(
                        "SELECT name FROM users WHERE id = ($1)",
                        [userId],
                        (err, response) => {
                          if (err) {
                            console.log("DEBUG:", err);
                            res
                              .status(400)
                              .send("Could not assign user to session");
                          } else {
                            const username = response.rows[0].name;
                            db.query(
                              "INSERT INTO SessionUsers (sessionId, userId, username) VALUES ($1, $2, $3) RETURNING *",
                              [sessionid, userId, username],
                              (err) => {
                                if (err) {
                                  console.log("DEBUG:", err);
                                  res
                                    .status(400)
                                    .send("Could not assign user to session");
                                } else {
                                  res.status(200).send("Added user to session");
                                }
                              }
                            );
                          }
                        }
                      );
                    }
                  }
                }
              }
            );
          }
        }
      } catch {
        res.status(400).send("Could not assign user to session");
      }
    }
  );
});

// /addofflineuser
app.post("/addofflineuser", checkAuthenticated, (req, res) => {
  res.status(200).send("OK");
});

function generateSessionCode() {
  let chars = "acdefhiklmnoqrstuvwxyz0123456789".split("");
  let result = "";
  for (let i = 0; i < 6; i++) {
    let x = Math.floor(Math.random() * chars.length);
    result += chars[x];
  }
  upperCaseResult = result.toUpperCase();
  return upperCaseResult;
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`server running on port ${PORT}`));
