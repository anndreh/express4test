// Server.js

// BASE SETUP
// ===============================================================================================================

// Call the packages we need
var express    = require('express');
var app        = express();
var bodyParser = require('body-parser');
var morgan     = require('morgan');
var mongoose   = require('mongoose');

var jwt    = require('jsonwebtoken'); // used to create, sign, and verify tokens
var config = require('./config'); // get our config file
var User   = require('./app/models/user'); // get our mongoose model
var Bear   = require('./app/models/bear.js');

// =======================
// configuration =========
// =======================
// this will let us get the data from a POST
var port = process.env.PORT || 8080; // Set the port
mongoose.connect(config.database); // connect to database
app.set('superSecret', config.secret);

// configure app to use bodyParser()
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// use morgan to log requests to the console
app.use(morgan('dev'));


// =======================
// routes ================
// =======================
// Basic route
var router = express.Router();

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.get("/", function(req, res) {
  res.json({message: "Hoorray! Welcome to our API!"});
});

// routes for users ======
// =======================
router.get('/setup', function(req,res) {

  // Create a sample user
  var andre = new User({
    name: "Andre Martins",
    password: "senha",
    admin: true
  });

  andre.save(function(err) {
    if (err)
      res.send(err);

    res.json({message: "User saved Successfully!"});
  })
});

router.get('/users', function(req, res) {
  User.find(function(err, users){
    if (err)
      res.send(err);

    res.json(users);
  });
})

// routes authentication =
// =======================
router.post('/authenticate', function(req, res) {
  User.findOne({
    name: req.body.name
  }, function(err, user) {

    if (err)
      res.send(err);

    if (!user) {
      res.json({ success: false, message: 'Authentication failed. User not found.'});
    } else if (user) {

      // check if password matches
      if (user.password != req.body.password) {
        res.json({ success: false, message: 'Authentication failed. Wrong password.' });
      } else {

        // if user is found and password is right
        // create a token
        var token = jwt.sign(user, app.get('superSecret'), {
          expiresInMinutes: 1440 // 24hs
        });

        // return the information including token as JSON
        res.json({
          success: true,
          message: 'Enjoy your token',
          token: token
        });

      }

    }

  });
});

// route middleware to authenticate and check token ==
// ===================================================
router.use(function(req, res, next) {
  // check header or url parameters or post parameters for token
  var token = req.body.token || req.param('token') || req.headers['x-access-token'];

  // decode token
  if (token) {
    // verifies secret and checks exp
    jwt.verify(token, app.get('superSecret'), function(err, decoded) {
      if (err) {
        return res.json({ success: false, message: 'Failed to authenticate token.' });    
      } else {
        req.decoded = decoded;
        next();
      }
    });

  } else {
    // if there is no token
    // return an error
    return res.status(403).send({
      success: false,
      message: 'No token provided.'
    });

  }

})


// routes for bears ======
// =======================

// on routes that end in /bears
router.route('/bears')

  // create a bear (accessed at POST http://localhost:8080/api/bears)
  .post(function(req, res) {

    var bear = new Bear();      // create a new instance of the Bear model
    bear.name = req.body.name;  // set the bears name (comes from the request)

    // save the bear and check for errors
    bear.save(function(err) {
      if (err) {
        res.send(err);
        console.log(err);
      }

      res.json({ message: 'Bear Created - ' + bear.name });
    });

  })

  // Get all bears (accessed at GET http://localhost:8080/api/bears)
  .get(function(req, res) {

    Bear.find(function(err, bears){
      if (err)
        res.send(err);

      res.json(bears);
    });

  });

// on routes that end in /bears/:bear_id
router.route('/bears/:bear_id')

  // get the bear with that id (accessed at GET http://localhost:8080/api/bears/:bear_id)
  .get(function(req, res) {

    Bear.findById(req.params.bear_id, function(err, bear) {

      if (err)
        res.send(err);

      res.json(bear);

    });

  })

  // update the bear with this id (accessed at PUT http://localhost:8080/api/bears/:bear_id)
  .put(function(req, res) {

    // use our bear model to find the bear we want
    Bear.findById(req.params.bear_id, function(err, bear) {

      if (err)
        res.send(err);

      bear.name = req.body.name; // update the bears info
      bear.height = req.body.height;

      bear.save(function(err) {

        if (err)
          res.send(err);

        res.json({ message: "Bear updated" });

      });

    });

  })

  // delete the bear with this id (accessed at DELETE http://localhost:8080/api/bears/:bear_id)
  .delete(function(req, res) {

    Bear.remove({
      _id: req.params.bear_id
    }, function(err, bear) {
      if (err)
        res.send(err);

      res.json({message: "Successfully deleted"})
    });

  });

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', router);

// START SERVER
// ===============================================================================================================
app.listen(port);
console.log('Magic happens on port ' + port);