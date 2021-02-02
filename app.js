require('dotenv').config();
const express =require("express");
const bodyParser =require("body-parser");
const ejs = require("ejs");
const mongoose=require('mongoose');
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static("public"));
app.use(session({
   secret: process.env.SECRET,
   resave:false,
   saveUninitialized:false
}))
app.use(passport.initialize());
app.use(passport.session());
let con1=mongoose.createConnection('mongodb://localhost:27017/userdatabase',{ useNewUrlParser: true, useUnifiedTopology: true});
const userSchema=new mongoose.Schema({
    email:String,
    password:String
})
mongoose.set('useCreateIndex', true);
userSchema.plugin(passportLocalMongoose);
const User=con1.model("User",userSchema);
passport.use(User.createStrategy());
passport.serializeUser(function(user, done) {
    done(null, user);
  });
  
  passport.deserializeUser(function(user, done) {
    done(null, user);
  });
app.get("/success",function(req,res){
    if(req.isAuthenticated()){
        res.send("<h1>User Succesfully Authenticated</h1>");
    }else{
        res.send("<h1>Please login first</h1>");
    }
})
app.post("/register",function(req,res){
    console.log(req.body.email);
    console.log(req.body.password);
    User.register({username: req.body.email},req.body.password,function(err,user){
        if(err){
            console.log(err);
            console.log("Registeration Error");
        }else{
            passport.authenticate("local",function(err,user,info){
                if(err){
                    console.log(err);
                }else{
                    console.log("Successfully Registered");
                }
            })(req,res);
        }
    })
})
app.post("/login",function (req, res){
    const user=new User({
        email:req.body.email,
        password:req.body.password
    })
    req.login(user,function(err){
        if(err){
            console.log("Login Error");
            console.log(err);
        }else{
            passport.authenticate("local",function(err,user,info){
                if(err){
                    console.log(err);
                }else{
                    console.log("Successfully Logged in");
                }
            })(req,res);
        }
    })
})
app.get("/logout",function(req,res){
    req.logout();
    console.log("Succesfully logged out");
});
////////////////////////////////////////////////////////////////////Authentication Section Complete////////////////////////////////////////////////////////////////////
let con2=mongoose.createConnection('mongodb://localhost:27017/blogdatabase',{ useNewUrlParser: true, useUnifiedTopology: true});
const articleSchema = {
  title: String,
  content: String,
  nooflikes:Number
};
const Article = con2.model("Article", articleSchema);
app.route("/articles")
.get(function(req, res){
  Article.find(function(err, foundArticles){
    if(!err) {
      res.send(foundArticles);
    }else {
      res.send(err);
    }
  });
})
.post(function(req, res){
  const newArticle = new Article({
    title: req.body.title,
    content: req.body.content,
    nooflikes:0
  });
  console.log("Post request");
  newArticle.save(function(err){
    if (!err){
      res.send("Successfully added a new article.");
    } else {
      res.send(err);
    }
  });
})
.delete(function(req, res){
  Article.deleteMany(function(err){
    if (!err){
      res.send("Successfully deleted all articles.");
    } else {
      res.send(err);
    }
  });
});
app.route("/articles/:articleTitle")
.get(function(req, res){
  Article.findOne({title: req.params.articleTitle}, function(err, foundArticle){
    if (foundArticle) {
      res.send(foundArticle);
    } else {
      res.send("No articles matching that title was found.");
    }
  });
})
.put(function(req,res){
    const aname=req.params.title;
    Article.replaceOne({title:aname},{title:req.body.title,content:req.body.content,nooflikes:0},function(err,results){
        if(err){
            console.log(err);
        }else{
            console.log("Succesful put request");
        }
    })
})
.patch(function(req, res){
  Article.update(
    {title: req.params.articleTitle},
    {$set: req.body},
    function(err){
      if(!err){
        res.send("Successfully updated article.");
      } else {
        res.send(err);
      }
    }
  );
})
.delete(function(req, res){
  Article.deleteOne(
    {title: req.params.articleTitle},
    function(err){
      if (!err){
        res.send("Successfully deleted the corresponding article.");
      } else {
        res.send(err);
      }
    }
  );
});
//add likes to the particular blog on request
app.route("/articles/:articleTitle/likes")
.get(function(req,res){
    Article.findOneAndUpdate(
        { "title" : req.params.articleTitle},
        { $inc: { "nooflikes" : 1 } },function(err){
            if(err){
                console.log("err");
            }else{
                console.log("Successfully liked the post");
            }
        }
     )
})
app.listen(3000, function () {
    console.log("Server started on port 3000");
});