const express = require("express");
const app = express();

const passport = require("passport");

const flash = require("express-flash");

var cookieParser = require("cookie-parser");
app.use(cookieParser());

const cors = require("cors");
var corsOptions = {
  origin: "http://localhost:3001",
  optionsSuccessStatus: 200, // For legacy browser support
  credentials: true,
};
app.use(cors(corsOptions));

const session = require("express-session");
const MemoryStore = require("memorystore")(session);

const methodOverride = require("method-override");
const bodyParser = require("body-parser");

const db = require("./db/index");
const { initDb } = require("./db/db-config");

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

initDb();

const initPassport = require("./passport-config");
const {
  checkAccessToken,
  checkRefreshToken,
} = require("./src/middleware/checkToken");
const checkAccountActive = require("./src/middleware/checkAccountActive");
const checkAccountInactive = require("./src/middleware/checkAccountInactive");
// const checkAuthenticated = require("./src/middleware/checkAuthenticated");

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

// ROUTES
app.use(
  "/users",
  [checkAccessToken, checkAccountActive],
  require("./src/routes/users")
);
app.use("/register", require("./src/routes/register"));
app.use("/login", require("./src/routes/login"));
app.use("/logout", [checkRefreshToken], require("./src/routes/logout"));
app.use(
  "/session",
  [checkAccessToken, checkAccountActive],
  require("./src/routes/session")
);
app.use(
  "/transaction",
  [checkAccessToken, checkAccountActive],
  require("./src/routes/transaction")
);

app.use("/mail", require("./src/routes/mail"));
app.use(
  "/activateuser",
  checkAccountInactive,
  require("./src/routes/activateuser")
);

app.use("/passwordreset", require("./src/routes/passwordreset.js"));
app.use("/success", require("./src/routes/success.js"));

app.use("/checklogin", require("./src/routes/checklogin.js"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`server running on port ${PORT}`));
