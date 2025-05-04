import passport from "passport";
import FacebookStrategy from "passport-facebook";
import User from "../models/User.js";
import dotenv from "dotenv";
dotenv.config(); // ✅ Load biến môi trường

passport.use(new FacebookStrategy.Strategy(
  {
    clientID: process.env.FB_APP_ID,
    clientSecret: process.env.FB_APP_SECRET,
    callbackURL: "http://localhost:4000/api/v1/auth/facebook/callback",
    profileFields: ["id", "displayName", "photos", "email"]
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // 🔎 Tìm user theo Facebook ID
      let user = await User.findOne({ facebookId: profile.id });

      if (!user) {
        // ✅ Nếu chưa có thì tạo mới
        user = new User({
          username: profile.displayName,
          email: profile.emails?.[0]?.value || `${profile.id}@facebook.com`,
          photo: profile.photos?.[0]?.value,
          facebookId: profile.id
        });
        await user.save();
      }

      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});
passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});

export default passport;
