const passport=require("passport");
const GoogleStrategy=require(("passport-google-oauth20")).Strategy;
const User = require("../models/userModel")
const { findOne } = require("../models/userModel");
const userModel = require("../models/userModel");
const env =require("dotenv").config();


passport.use(new GoogleStrategy({
  clientID:process.env.GOOGLE_CLIENT_ID,
  clientSecret:process.env.GOOGLE_CLIENT_SECRET,
  // callbackURL:'/auth/google/callback'

  callbackURL: `${process.env.NODE_ENV==='production'?process.env.PRODUCTION_DOMAIN:'http://localhost:5678'}/auth/google/callback`


},
async (accessToken,refreshToken,profile,done)=>{
  try {
    let user=await User.findOne({googleId:profile.id});
    if(user){
      return done(null,user)
    }else{
      user=new User({
        name:profile.displayName,
        email:profile.emails[0].value,
        googleId:profile.id,
        isVerified:true

      });
      await user.save()
     
    }
   
  } catch (error) {
    return done(error,null)
  }
}
))

//user details will assin in session
passport.serializeUser((user,done)=>{
  done(null,user.id)
});

passport.deserializeUser((id,done)=>{
  User.findById(id)
  .then(user=>{
    done(null,user)
  })
  .catch(err=>{
    done(err,null)
  })
})

module.exports=passport;


