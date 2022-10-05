const express = require("express");
const app = express();

// const passport = require("passport");

const flash = require("express-flash");

var cookieParser = require("cookie-parser");
app.use(cookieParser());

const cors = require("cors");
var corsOptions = {
  origin: [
    "http://localhost:3001",
    "https://equalsplit.herokuapp.com",
    "https://equalsplit.vercel.app",
  ],
  optionsSuccessStatus: 200, // For legacy browser support
  credentials: true,
};
app.use(cors(corsOptions));

const path = require("path");

app.get("/favicon.ico", (req, res) => {
  // Use actual relative path to your .ico file here
  res.sendFile(path.resolve(__dirname, "./favicon.ico"));
});

app.use(function (req, res, next) {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; font-src 'self'; img-src 'self'; script-src 'self'; style-src 'self'; frame-src 'self'"
  );
  next();
});

const methodOverride = require("method-override");
const bodyParser = require("body-parser");

// const db = require("./db/index");
const { initDb } = require("./db/db-config");

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

initDb();

// const initPassport = require("./passport-config");
const {
  checkAccessToken,
  checkRefreshToken,
} = require("./src/middleware/checkToken");
const checkAccountActive = require("./src/middleware/checkAccountActive");
const checkAccountInactive = require("./src/middleware/checkAccountInactive");
app.set("view-engine", "ejs");
app.use(express.urlencoded({ extended: false }));
app.use(flash());
app.use(bodyParser.json());

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
