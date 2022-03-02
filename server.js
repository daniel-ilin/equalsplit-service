const express = require("express");
const app = express();

const passport = require("passport");


const flash = require("express-flash");

var cookieParser = require("cookie-parser");
app.use(cookieParser());
const session = require("express-session");

const methodOverride = require("method-override");
const bodyParser = require("body-parser");

const db = require("./db/index");
const { initDb } = require("./db/db-config");

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

initDb();

const initPassport = require("./passport-config");
const checkAuthenticated = require("./src/middleware/checkAuthenticated");

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

const sessionConfig = {  
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,  
};

app.use(session(sessionConfig));

app.use(bodyParser.json());

app.use(passport.initialize());
app.use(passport.session());

app.use(methodOverride("_method"));



// ROUTES
app.use("/users", passport.authenticate('jwt', { session: false }), require("./src/routes/users"));
app.use("/register", require("./src/routes/register"));
app.use("/login", require("./src/routes/login"));
app.use("/logout", passport.authenticate('jwt', { session: false }), require("./src/routes/logout"));
app.use("/session", passport.authenticate('jwt', { session: false }), require("./src/routes/session"));
app.use("/transaction", passport.authenticate('jwt', { session: false }), require("./src/routes/transaction"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`server running on port ${PORT}`));
