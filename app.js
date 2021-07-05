
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const session = require("express-session");
const _ = require("lodash");


const homeStartingContent = "Welcome to Blogging Website.Any thing you want to express you can go directly on 'Compose New Post' link and can post a new blog on the home page.";

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


app.use(session({
  secret: 'this is our little secret',
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb://localhost:27017/blogDB', {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set("useCreateIndex", true);

const postSchema = {
  title: String,
  url: String,
  content: String
};

const Post = mongoose.model("Post",postSchema);

const userSchema = new mongoose.Schema({
  email: String,
  password: String
});
userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User",userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
app.get("/", function(req,res){
  res.render("home");
});

app.get("/homee", function(req,res){
  if(req.isAuthenticated()){
  Post.find({}, function(err,posts){
    res.render("homee", {
      startingContent: homeStartingContent,
      posts: posts
    });
  });
}
else{
  res.redirect("/login");
}
});



app.get("/register", function(req,res){
  res.render("register");
});
app.get("/login", function(req,res){
  res.render("login");
});


app.post("/register", function(req,res){
  User.register({username:req.body.username}, req.body.password, function(err,user){
    if(err){
      console.log(err);
      res.redirect("/register");
    }
    else{
      passport.authenticate("local")(req,res,function(){
        res.redirect("/homee");
      });
    }
  });
});

app.post("/login", function(req,res){
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });
  req.login(user, function(err){
    if(err){
       res.send("logged err", 404);
    }else{
      passport.authenticate("local")(req,res,function(){
        res.redirect("/homee");
      });
    }
  });
});



app.get("/about", function(req, res){
  res.render("about");
});

app.get("/contact", function(req, res){
  res.render("contact");
});

app.get("/compose", function(req, res){
  res.render("compose");
});

app.post("/compose", function(req, res){
  const post = new Post({
    title: req.body.postTitle,
    url: req.body.imgUrl,
    content: req.body.postBody
  });
 post.save()
  res.redirect("/homee");

});

app.post("/delete", function(req,res){
      const depostId=req.body.button;
      Post.findByIdAndRemove(depostId, function(err){
        if(!err){
          console.log("successfully deleted post");
          res.redirect("/homee");
        }
      })
});

app.get("/edit/:id", (req, res) => {
  const requestedId = req.params.id;
  Post.findOne({_id: requestedId}, function(err, post){
    if (!err) {
      res.render("edit", {
        title: post.title,
        content: post.content,
        postId: post._id
      });
    }
  });
});

app.post("/edit/:id", (req, res) => {
  const requestedId = req.params.id;
  Post.findOneAndUpdate({_id: requestedId},{$set: {title: req.body.postTitle, content: req.body.postBody}}, function(err, post){
    if (!err) {
      res.redirect("/homee");
    }
  });
});



app.get("/posts/:postId", function(req, res){
  const requestedPostId = req.params.postId;

 Post.findOne({_id: requestedPostId}, function(err,post){
   res.render("post",{
     title: _.capitalize(post.title),
     content: post.content,
     url: post.url
   });
 });

});

app.get("/logout", function(req,res){
  req.logout();
  res.redirect("/");
})
app.listen(3000, function() {
  console.log("Server started on port 3000");
});
