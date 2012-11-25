/* Require dependencies and create server
---------------------------------------------------------------------------------------- */
var http 	 = require('http');
var express  = require('express');
var engines  = require('consolidate');
var swig     = require('swig');
var Minassic = require('../../index.js');

var app = express();
var server = http.createServer(app);

/* Routing
---------------------------------------------------------------------------------------- */
app.get('/', function(req, res) {
	res.render('index');
});

/* Configuration
---------------------------------------------------------------------------------------- */
// default configuration
var config = {

	minassic: {
		assets: __dirname + '/public',
		cache:  __dirname + '/public/cache',
		flags: false
	},

	swig: {
		root: __dirname + '/views'
	}

};

app.configure('production', function() {

	// Override default flags for minify and concationate of all assets by default
	config.minassic.flags = ['minify', 'concatenate'];

});

app.configure(function() {

	// initiate minassic asset compression and pass it to the swig configuration
	var minassic = new Minassic(config.minassic);
	config.swig.tags = {
		minassic: Minassic.swig(minassic)
	};

	// configure template engine
	swig.init(config.swig);
	app.engine('html', engines.swig);
	app.set('view engine', 'html');

	// set directory for static files
	app.use(express.static(config.minassic.cache, { maxAge: 311040000 }));
	app.use(express.static(config.minassic.assets));

});

/* Run Server
---------------------------------------------------------------------------------------- */
var port = 3000;
server.listen(port);
console.log("Express server listening on port %d in %s mode", port, app.get('env'));