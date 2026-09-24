const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const connection = require('./database');

// Serialize & Deserialize tetap simple
passport.serializeUser((user, done) => {
    done(null, user.ID_User);
});

passport.deserializeUser((id, done) => {
    connection.query(
        'SELECT * FROM user WHERE ID_User = ?',
        [id],
        (error, results) => {
            if (error) return done(error);
            done(null, results[0]);
        }
    );
});

// Google Strategy yang lebih simple
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                callbackURL:
                    process.env.GOOGLE_CALLBACK_URL ||
                    'http://localhost:3000/api/auth/google/callback',
                state: true
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    if (
                        !profile.emails?.[0]?.value ||
                        profile._json?.email_verified !== true
                    )
                        return done(null, false);
                    // Cek user yang sudah ada
                    connection.query(
                        'SELECT * FROM user WHERE Email = ?',
                        [profile.emails[0].value],
                        async (error, results) => {
                            if (error) {
                                return done(error);
                            }

                            // Jika user sudah ada
                            if (results.length > 0) {
                                return done(
                                    null,
                                    results[0].Status === 'Active'
                                        ? results[0]
                                        : false
                                );
                            }

                            // Jika user baru
                            connection.query(
                                `INSERT INTO user (Nama, Email, Role, Password, Status) 
                         VALUES (?, ?, 'User', '', 'Active')`,
                                [profile.displayName, profile.emails[0].value],
                                (error, results) => {
                                    if (error) {
                                        return done(error);
                                    }

                                    const newUser = {
                                        ID_User: results.insertId,
                                        Nama: profile.displayName,
                                        Email: profile.emails[0].value,
                                        Role: 'User'
                                    };

                                    // Log aktivitas
                                    connection.query(
                                        `INSERT INTO log_aktivitas (ID_User, Aksi) 
                                 VALUES (?, ?)`,
                                        [
                                            results.insertId,
                                            `Registrasi via Google: ${profile.emails[0].value}`
                                        ]
                                    );

                                    return done(null, newUser);
                                }
                            );
                        }
                    );
                } catch (error) {
                    return done(error);
                }
            }
        )
    );

module.exports = passport;
