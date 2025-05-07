import passport from "passport";
import FacebookStrategy from "passport-facebook";
import User from "../models/User.js";
import dotenv from "dotenv";
dotenv.config();

passport.use(new FacebookStrategy.Strategy(
  {
    clientID: process.env.FB_APP_ID,
    clientSecret: process.env.FB_APP_SECRET,
    callbackURL: "http://localhost:4000/api/v1/auth/facebook/callback",
    profileFields: ["id", "displayName", "photos", "email"]
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value || `${profile.id}@facebook.com`;
      const baseUsername = profile.displayName || "facebook_user";

      // Kiểm tra user tồn tại theo email (ưu tiên email hơn facebookId)
      let user = await User.findOne({ email });

      if (!user) {
        // Xử lý nếu username bị trùng
        let uniqueUsername = baseUsername;
        let count = 1;
        while (await User.findOne({ username: uniqueUsername })) {
          uniqueUsername = `${baseUsername}_${count}`;
          count++;
        }

        user = new User({
          username: uniqueUsername,
          email: email,
          photo: profile.photos?.[0]?.value,
          facebookId: profile.id,
          password: null
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
