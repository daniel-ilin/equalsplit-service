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
        if (!user) {
          res.redirect("/login");
        }

        if (await bcrypt.compare(password, user.password)) {
          db.query(
            "SELECT * FROM users WHERE id = ($1);",
            [user.id],
            (err, response) => {              
              req.user = response
              return next();
            }
          );
        }
      }
    );
  } catch (errorMessage) {
    res.status(400).send({ error: `${errorMessage}` });
  }
}

module.exports = authenticateUser;
