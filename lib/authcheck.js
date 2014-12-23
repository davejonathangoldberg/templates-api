module.exports = function AuthCheck(app) {
  
  // REQUIRED LIBRARIES
  var async = require('async');
  
  
  // RELATIVE REFERENCES 
  var Coredb = require('./coredb.js');
  var Models = require('../models');
  
  var coredb = new Coredb(app);
  var models = new Models();
  
  // CHECK CLIENT WRITE PERMISSIONS
  this.checkClientPermissions = function(checkPermissions, callback){
    console.log('checkPermissions: ' + JSON.stringify(checkPermissions));
    if(checkPermissions.permissions.indexOf(checkPermissions.client) > -1){
      callback(null, true);
    } else {
      callback(null, false);
    }
  }
  
  
}