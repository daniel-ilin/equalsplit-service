const express = require("express");
const app = express();
const passport = require("passport");
const flash = require("express-flash");

const session = require("express-session");
const MemoryStore = require("memorystore")(session);

const methodOverride = require("method-override");
const bodyParser = require("body-parser");

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

const { initDb } = require("./db/db-config");

initDb();

// ROUTES
app.use("/users", require("./src/routes/users"));
app.use("/register", require("./src/routes/register"));
app.use("/login", require("./src/routes/login"));
app.use("/logout", require("./src/routes/logout"));
app.use("/session", require("./src/routes/session"));
app.use("/transaction", require("./src/routes/transaction"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`server running on port ${PORT}`));
