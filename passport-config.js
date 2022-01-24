const localStategy = require('passport-local').Strategy
const bcrypt = require('bcrypt')

function init(passport, getUserByEmail, getUserById) {
    const authenticateUser = async (email, password, done) => {                        

        getUserByEmail(email, async (fetchedUser) => {
            const user = fetchedUser.rows[0]            
            if(user == null) {
                return done(null, false, { message: "No user with that email" })
            }
    
            try {
                if (await bcrypt.compare(password, user.password)) {                    
                    return done(null, user)
                } else {                    
                    return done(null, false, {message: "Password incorrect"})
                }
            } catch(err) {
                return done(err);
            }
        })                
    }

    passport.use(new localStategy({ usernameField: 'email'},
    authenticateUser))
    
    passport.serializeUser((user, done) => done(null, user.id))

    passport.deserializeUser((id, done) => {
        getUserById(id, (user) => {
            done(null, user)
        })
    })
}

module.exports = init