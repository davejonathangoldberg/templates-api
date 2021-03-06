module.exports = function Coredb(app) {
  
  // REQUIRED LIBRARIES
  var mongoose = require('mongoose');
  var async = require('async');
  var jjv = require('jjv');
  
  // RELATIVE REFERENCES 
  var Models = require('../models');
  
  var models = new Models();
  
  /*
   *
   * CORE DB OPERATIONS
   *
   */
  
  // FIND
  this.findRecords = function(data, callback){
    data.options = data.options || {};
    data.model.find(data.query, data.options, function(err, resource) {
      if (err) {
        console.error(err);
        var st_err = {
          "name" : "Database Lookup Error",
          "code" : 500,
          "type" : "Database",
          "value" : err.message
        };
        callback(st_err, "");
      }
      data.collection = resource;
      console.log('findRecordsData: ' + JSON.stringify(data) + '\n');
      callback(null, data);
    });
  }
  
  // FIND ONE
  this.findOneRecord = function(data, callback){
    data.options = data.options || {};
    data.model.findOne(data.query, data.options, function(err, resource) {
      if (err) {
        console.error(err);
        var st_err = {
          "name" : "Database Lookup Error",
          "code" : 500,
          "type" : "Database",
          "value" : err.message
        };
        callback(st_err, "");
      }
      if(!resource) {
        data.instance = '';
        callback(null, data);
      } else {
        data.instance = resource;
        callback(null, data);
      }
    });
  }
  
  // CREATE
  this.insertItem = function(data, callback){
    var newInstance = new data.model(data); // INSTANTIATE NEW DB MODEL
    newInstance.save(function(err, newInstance) {  // SAVE TO DB
      if (err) {
        console.error(err);
        var st_err = {
          "name" : "Database Insert Error",
          "code" : 500,
          "type" : "Database",
          "value" : err.message
        };
        return callback(st_err, "");
      }
      data.instance = newInstance;
      callback(null, data);
    });
  }

  // UPDATE
  this.updateItem = function(data, callback){
    data.options = data.options || {};
    data.model.update(data.query, data.updateQuery, data.options, function(err, numberUpdated, updateInfo){
      if (err) {
        console.error(err);
        var st_err = {
          "name" : "Database Insert Error",
          "code" : 500,
          "type" : "Database",
          "value" : err.message
        };
        return callback(st_err, "");  
      } else {
        console.log("data: " + JSON.stringify(data) + '\n');
        console.log('numberUpdated: ' + numberUpdated + '\n');
        console.log("updateInfo: " + JSON.stringify(updateInfo) + '\n');
        data.numberUpdated = numberUpdated;
        data.updateInfo = updateInfo;
        callback(null, data);
      }
    });
  }
  
  // FIND ONE AND UPDATE
  this.findAndUpdateRecords = function(data, callback){
    console.log('findandUpdateRecords Data: ' + JSON.stringify(data) + '\n');
    data.statusCode = data.statusCode || 200;
    data.headerObject = data.headerObject || {};
    data.model.findOneAndUpdate(data.query, data.updateQuery, data.options, function(err, updatedRecord){
      if (err) {
        console.log('update err: ' + err);
        callback(err, "");  
      } else {
        data.instance = updatedRecord;
        callback(null, data);
      }
    });
  }
  
  // DELETE
  this.deleteItemVar = function(data, callback){
    data.model.find({ "id" : data.instanceId }).remove(function(err, resource){
      if (err) {
        console.log('err: ' + err + '\n');
        callback(err, '');   
      }
      if (resource === 0){
        data.deleted = false;
        callback(null, data); // RETURNS 404 ERROR.
      } else {
        data.deleted = true;
        callback(null, data);
      }
    });
  }
  
  // DELETE
  this.deleteItem = function(res, model, resourceName, instanceId, callback){
    model.find({ "id" : instanceId }).remove(function(err, resource){
      if (err) {
        console.log('err: ' + err + '\n');
        return returnServerError(res);   
      }
      if (resource === 0){
        return returnNotFound(res); // RETURNS 404 ERROR.
      } else {
        callback(null, { "success" : true });
      }
    });
  }

}