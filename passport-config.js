const localStategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");

const JWTstrategy = require("passport-jwt").Strategy;
const ExtractJWT = require("passport-jwt").ExtractJwt;

function init(passport, getUserByEmail, getUserById) {
  const authenticateUser = async (email, password, done) => {
    getUserByEmail(email, async (fetchedUser) => {
      const user = fetchedUser.rows[0];
      if (user == null) {
        return done(null, false, { message: "No user with that email" });
      }

      try {
        if (await bcrypt.compare(password, user.password)) {
          return done(null, user);
        } else {
          return done(null, false, { message: "Password incorrect" });
        }
      } catch (err) {
        return done(err);
      }
    });
  };

  passport.use(new localStategy({ usernameField: "email" }, authenticateUser));

  passport.serializeUser((user, done) => done(null, user.id));

  passport.deserializeUser((id, done) => {
    getUserById(id, (user) => {
      done(null, user);
    });
  });

  passport.use(
    new JWTstrategy(
      {
        secretOrKey: process.env.ACCESS_TOKEN_KEY,
        jwtFromRequest: ExtractJWT.fromHeader('x-auth-token'),
      }, function(token, done) {
        getUserById(token.user_id, (user) => {                                                
            done(null, user)
          });
      }
    )
  );
}

module.exports = init;
