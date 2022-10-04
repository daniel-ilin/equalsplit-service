const db = require("./../../db/index");
const bcrypt = require("bcrypt");

async function authenticateUser(req, res, next) {
  try {
    const email = req.body.email;
    const password = req.body.password;
    db.query(
      "SELECT * FROM users WHERE email = ($1);",
      [email],
      async (err, fetchedUser) => {
        const user = fetchedUser.rows[0];
        if (user === undefined) {
          res.redirect("/login");
          return;
        }

        if (await bcrypt.compare(password, user.password)) {
          db.query(
            "SELECT * FROM users WHERE id = ($1);",
            [user.id],
            (err, response) => {
              console.log(response);
              req.user = response;
              return next();
            }
          );
        } else {
          res.status(400).send({ error: `Incorrect Password` });
        }
      }
    );
  } catch (errorMessage) {
    res.status(400).send({ error: `${errorMessage}` });
  }
}

module.exports = authenticateUser;
