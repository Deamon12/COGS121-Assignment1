//load environment variables
var dotenv = require('dotenv');
dotenv.load();

//add instagram api setup
var ig = require('instagram-node-lib');
ig.set('client_id', process.env.INSTAGRAM_CLIENT_ID);
ig.set('client_secret', process.env.INSTAGRAM_CLIENT_SECRET);

//export ig as a parameter to be used by other methods that require it.
exports.ig = ig;