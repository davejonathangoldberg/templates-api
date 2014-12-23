// App.js
module.exports = function App() {
  var express = require('express');
  var app = express();
  var favicon = require('serve-favicon');
  var logger = require('morgan');
  var methodOverride = require('method-override');
  var session = require('express-session');
  var bodyParser = require('body-parser');
  var multer = require('multer');
  var errorHandler = require('errorhandler');
  
  
  var localPort = 8080;
  var port = process.env.PORT || localPort;
  
  app.version = "1.0";
  app.port = (port == localPort) ? (":" + port) : ("");
  app.host = "";
  app.basepath = '/';
  app.mediaType = 'application/json';
  
  app.set('views', __dirname + '/views');
  app.use('*', function(req, res, next){
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, DELETE, PUT, PATCH, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, api_key, Authorization');
    next();
  });
  app.use(express.static(__dirname + '/public/'));
  console.log(__dirname + '/public/');
  //app.use(favicon(__dirname + '/public/favicon.ico'));
  app.use(logger('dev'));
  //app.use(methodOverride());
  //app.use(session({ resave: true,
  //                  saveUninitialized: true,
  //                  secret: 'uwotm8' }));
  app.use(bodyParser.json());
  app.use(bodyParser.text());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(multer());

  app.use(function(err, req, res, next){
    if(err.status === 400 ){
      var errorMessage = "Invalid or Unsupported Request. Please check your input and try again.";
      var errorTemplate = { "requestRoute" : req.path, "message" : errorMessage };
      res.set('Content-Type', app.mediaType);
      res.statusCode = 400;
      res.status(res.statusCode).json(errorTemplate);
    } else {
      var errorMessage = "Internal Server Error.";
      var errorTemplate = { "requestRoute" : req.path, "message" : errorMessage };
      res.set('Content-Type', app.mediaType);
      res.statusCode = 500;
      res.status(res.statusCode).json(errorTemplate);
    }
  });

  
  app.listen(port);
  console.log('Listening on port ' + port + ' at ' + new Date());
  return app;
};