//dependencies for each module used
var express = require('express');
var graph = require('fbgraph');
var InstagramStrategy = require('passport-instagram').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var http = require('http');
var path = require('path');
var handlebars = require('express-handlebars');
var bodyParser = require('body-parser');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var dotenv = require('dotenv');
var Instagram = require('instagram-node-lib');
var mongoose = require('mongoose');
var app = express();

//local dependencies
var models = require('./models');

var hashtag = require('./hashtag');

//client id and client secret here, taken from .env
dotenv.load();
var INSTAGRAM_CLIENT_ID = process.env.INSTAGRAM_CLIENT_ID;
var INSTAGRAM_CLIENT_SECRET = process.env.INSTAGRAM_CLIENT_SECRET;
var INSTAGRAM_CALLBACK_URL = "http://127.0.0.1:3000/auth/instagram/callback";
Instagram.set('client_id', INSTAGRAM_CLIENT_ID);
Instagram.set('client_secret', INSTAGRAM_CLIENT_SECRET);




/** Book of Faces */
var FACEBOOK_APP_ID = process.env.FACEBOOK_CLIENT_ID;
var FACEBOOK_APP_SECRET = process.env.FACEBOOK_CLIENT_SECRET;
var FACEBOOK_CALLBACK_URL = "http://127.0.0.1:3000/auth/facebook/callback";


var passport = require('passport')
  , FacebookStrategy = require('passport-facebook').Strategy;

var authUrl = graph.getOauthUrl({
	"client_id":     FACEBOOK_APP_ID
      , "redirect_uri":  FACEBOOK_CALLBACK_URL
      });

passport.use(new FacebookStrategy({
    clientID: FACEBOOK_APP_ID,
    clientSecret: FACEBOOK_APP_SECRET,
    callbackURL: FACEBOOK_CALLBACK_URL
  },
  function(accessToken, refreshToken, profile, done) {
    // asynchronous verification, for effect...
    //console.log("Fb accessToken: "+accessToken);
    graph.setAccessToken(accessToken);
    //console.log("Fb refreshToken: "+refreshToken);
    models.User.findOrCreate({
      "name": profile.username,
      "id": profile.id,
      "access_token": accessToken
    }, 
    function(err, user, created){
      if(err){
	console.log("Error creating FB user: "+err);
      }
      else if(user){
	//console.log("User exists.");
      }
      
      
    return done(null, profile);
      
    });
  }
));






//connect to database
mongoose.connect(process.env.MONGODB_CONNECTION_URL);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function (callback) {
  console.log("Database connected succesfully.");
});

// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.  However, since this example does not
//   have a database of user records, the complete Instagram profile is
//   serialized and deserialized.

passport.serializeUser(function(user, done) {
  //console.log("trying to serialize");
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  //console.log("trying to deserialize");
  done(null, obj);
});


// Use the InstagramStrategy within Passport.
//   Strategies in Passport require a `verify` function, which accept
//   credentials (in this case, an accessToken, refreshToken, and Instagram
//   profile), and invoke a callback with a user object.
passport.use(new InstagramStrategy({
    clientID: INSTAGRAM_CLIENT_ID,
    clientSecret: INSTAGRAM_CLIENT_SECRET,
    callbackURL: INSTAGRAM_CALLBACK_URL
  },
  function(accessToken, refreshToken, profile, done) {
    // asynchronous verification, for effect...
    models.User.findOrCreate({
      "name": profile.username,
      "id": profile.id,
      "access_token": accessToken
      
    }, function(err, user, created) {
      
      
      // created will be true here
      models.User.findOrCreate({}, function(err, user, created) {
        // created will be false here
        process.nextTick(function () {
	  console.log("Insta user: "+user);
	  
	  
          // To keep the example simple, the user's Instagram profile is returned to
          // represent the logged-in user.  In a typical application, you would want
          // to associate the Instagram account with a user record in your database,
          // and return that user instead.
          return done(null, profile);
        });
      })
    });
  }
));

//Configures the Template engine
app.engine('handlebars', handlebars({defaultLayout: 'layout'}));
app.set('view engine', 'handlebars');
app.set('views', __dirname + '/views');
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(session({ secret: 'keyboard cat',
                  saveUninitialized: true,
                  resave: true}));
app.use(passport.initialize());
app.use(passport.session());

//set environment ports and start application
app.set('port', process.env.PORT || 3000);

// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next(); 
  }
  res.redirect('/login');
}

//routes
app.get('/', function(req, res){
  res.render('login');
});

app.get('/login', function(req, res){
  res.render('login', { user: req.user });
});

app.get('/account', ensureAuthenticated, function(req, res){
  res.render('account', {user: req.user});
});

app.get('/facebookaccount', ensureAuthenticated, function(req, res){
  
  
  //var params = { fields: "id" , fields: "picture" , fields: "message", fields: "likes" };//fields: "id" 
  var query  = models.User.where({ name: req.user.username });
  query.findOne(function (err, user) {
    if (err) return handleError(err);
    if (user) {
      
      
      //console.log("req.user: "+user.access_token);
      
      var coverPhoto;
      var params = { fields: "cover" };	//fields: "posts"
      graph.get("me", params,  function(err, coverResponse) {
      //console.log(coverResponse.cover.source);
      coverPhoto = coverResponse.cover.source;
      });
      
      
      var params = { fields: "feed" };	//fields: "posts"
      graph.get("me", params,  function(err, postsResponse) {
      
	//console.log(postsResponse.posts.data);
	//console.log(response.posts.data); 
	//console.log(response.id); 
	//console.log(response.posts.icon); 
	      
	      
	      
	      //for(var i in someData) {
		      
		      //var item = someData[i];
		      
		      
	      //}
	      
	      /*
	var newJson = {fbPosts: []};
	      
	
	for(var i = 0; i < postsResponse.posts.data.length; i++) {
	//var obj = postsResponse.posts.data[i];
	
	
	console.log("message: "+postsResponse.posts.data[i].message);
	console.log("message: "+postsResponse.posts.data[i]);
	
	
	if(postsResponse.posts.data[i].message){
	newJson.fbPosts.push({
		        "message" : postsResponse.posts.data[i].message
			});
	}
	else{
		newJson.fbPosts.push({
		        "message" : postsResponse.posts.data[i].description
			});
	
	}
	
	
		 
	
	//console.log(postsResponse.posts.data[i]);
	if(postsResponse.posts.data[i].type == "photo"){
	  
	  
		//postsResponse.posts.data[i].imageid = //"https://graph.facebook.com/"+postsResponse.posts.data[i].object_id+"/picture?type=normal"
		
		newJson.fbPosts.push({
			"fromName" : postsResponse.posts.data[i].from.name,
			"link": postsResponse.posts.data[i].link,
		        "object_id" : postsResponse.posts.data[i].object_id
		        
		});
	}
	
	
	}
	*/
	
	      //console.log(postsResponse.feed.data)
		//posts: postsResponse.posts.data
	res.render('facebookaccount', {  coverPhoto: coverPhoto, posts: postsResponse.feed.data,  user: req.user, accessToken: user.access_token});
      
       });
      
    }// end user check
    
  });
  
});




app.get('/facebooklikes', ensureAuthenticated, function(req, res){
	
	
	//var params = { fields: "id" , fields: "picture" , fields: "message", fields: "likes" };//fields: "id" 
	var query  = models.User.where({ name: req.user.username });
	query.findOne(function (err, user) {
		if (err) return handleError(err);
		      
			      
			      
			//console.log("req.user: "+user.access_token);
			    
			var coverPhoto;
			var params = { fields: "cover" };
		        graph.get("me", params,  function(err, coverResponse) {
		        if (err) return handleError(err);
		        //console.log(coverResponse.cover);
		        coverPhoto = coverResponse.cover.source;
		        });
			    
			      
			var likes;
			var params = { fields: "likes" };	//fields: "posts"
			graph.get("me", params,  function(err, likesResponse) {
			if (err) return handleError(err);
			
			console.log(likesResponse.likes.data);
			likes = likesResponse.likes.data;
			res.render('facebooklikes', {coverPhoto: coverPhoto, posts: likes, user: req.user});
			});
			      
			    	
		          
	});
	
});





















app.get('/instagramaccount', ensureAuthenticated, function(req, res){
  var query  = models.User.where({ name: req.user.username });
  query.findOne(function (err, user) {
    if (err) return handleError(err);
    if (user) {
      console.log("found user: "+user);
      // doc may be null if no document matched
      Instagram.users.liked_by_self({
	
        access_token: user.access_token,
        complete: function(data) {
	  console.log(data);
          //Map will iterate through the returned data obj
	  
          var imageArr = data.map(function(item) {
            //create temporary json object
            tempJSON = {};
            tempJSON.url = item.images.low_resolution.url;
	    tempJSON.link = item.link;
	    tempJSON.caption = item.caption.text
	    tempJSON.from = item.user.username;
	    tempJSON.likes = item.likes.count;
	    
            //insert json object into image array
	    console.log(item);
            return tempJSON;
          });
          res.render('instagramaccount', {photos: imageArr, user: req.user});
        }
      }); 
    }
  });
});
  

app.get('/photos', ensureAuthenticated, function(req, res){
  var query  = models.User.where({ name: req.user.username });
  query.findOne(function (err, user) {
    if (err) return handleError(err);
    if (user) {
      console.log("found user: "+user);
      // doc may be null if no document matched
      Instagram.users.liked_by_self({
	
        access_token: user.access_token,
        complete: function(data) {
	  //console.log(user.access_token);
          //Map will iterate through the returned data obj
	  
          var imageArr = data.map(function(item) {
            //create temporary json object
            tempJSON = {};
            tempJSON.url = item.images.low_resolution.url;
	    tempJSON.link = item.link;
	    tempJSON.caption = item.caption.text
	    tempJSON.from = item.user.username;
	    tempJSON.likes = item.likes.count;
	    
            //insert json object into image array
	    console.log(item);
            return tempJSON;
          });
          res.render('photos', {photos: imageArr});
        }
      }); 
    }
  });
});











app.get('/feed', ensureAuthenticated, function(req, res){
  var query  = models.User.where({ name: req.user.username });
  query.findOne(function (err, user) {
    if (err) return handleError(err);
    if (user) {
      
      
      Facebook.users.liked_by_self({
	
        access_token: user.access_token,
        complete: function(data) {
	  //console.log(user.access_token);
          //Map will iterate through the returned data obj
	  
          var imageArr = data.map(function(item) {
            //create temporary json object
            tempJSON = {};
            tempJSON.url = item.images.low_resolution.url;
	    tempJSON.link = item.link;
	    tempJSON.caption = item.caption.text
	    tempJSON.from = item.user.username;
	    tempJSON.likes = item.likes.count;
	    
            //insert json object into image array
	    console.log(item);
            return tempJSON;
          });
          res.render('photos', {photos: imageArr});
        }
      }); 
      
      
      /*
      
      
      graph.get('likes', {limit: 2, access_token: user.access_token}, function(err, res) {
  if(res.paging && res.paging.next) {
      graph.get(res.paging.next, function(err, res) {
      console.log(res);
      });
      }
    });
      */
      res.render('feed');
      
    }
  });
});




app.get('/auth/facebook', passport.authenticate('facebook'));

// Facebook will redirect the user to this URL after approval.  Finish the
// authentication process by attempting to obtain an access token.  If
// access was granted, the user will be logged in.  Otherwise,
// authentication has failed.
//FACEBOOK REDIRECT
app.get('/auth/facebook/callback', 
  passport.authenticate('facebook', { failureRedirect: '/login'}),
  function(req, res) {
    //console.log(req);
    res.redirect('/facebookaccount');
  });

app.get('/auth/instagram',
  passport.authenticate('instagram'),
  function(req, res){
  });

// GET /auth/instagram/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
//INSTA REDIRECT
app.get('/auth/instagram/callback', 
  passport.authenticate('instagram', { failureRedirect: '/login'}),
  function(req, res) {
    //console.log(req);
    res.redirect('/instagramaccount');
  });

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/login');
});

http.createServer(app).listen(app.get('port'), function() {
    console.log('Express server listening on port ' + app.get('port'));
});

app.get('/hashtag', function (req, res) {
	res.render('hashtag');
})
app.post('/hashtag', hashtag.getHashtag);

