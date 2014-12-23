module.exports = function Utility(app) {
  
  // REQUIRED LIBRARIES
  var async = require('async');
  var config = require('./config.js');
  
  // SEND BUCKET RESPONSE
  this.bucketResponse = function(bucketInfo, callback){
    var response = {};
    var templateLink;
    response = {
      'bucketId'          : bucketInfo.bucketId,
      'readPermissions'   : bucketInfo.readPermissions,
      'writePermissions'  : bucketInfo.writePermissions,
      'metadata'          : bucketInfo.metadata || [],
      'createdDate'       : bucketInfo.createdDate || '',
      'modifiedDate'      : bucketInfo.modifiedDate || ''
    };
    templateLink = {
      "templates": { "href": config.baseDomain + "/buckets/" + bucketInfo.bucketId + "/templates" }
    };
    response._links = templateLink;
    callback(null, response);
  }
  
  // SEND BUCKET TEMPLATES RESPONSE
  this.bucketTemplatesResponse = function(bucketInfo, callback){
    var response = {};
    var templates = [];
    var templateLinks = {};
    var templateLink = {};
    
    for(i=0; i<bucketInfo.templates.length; i++){
      templateLink = { "href" : config.baseDomain + "/buckets/" + bucketInfo.bucketId + "/templates/" + bucketInfo.templates[i].templateId };
      templates.push(templateLink);
    }

    templateLinks = {
      "templates": templates
    };
    
    response._links = templateLinks;
    callback(null, response);
  }
  
  // CHECK IF TEMPLATE EXISTS
  this.checkTemplateExists = function(templateInfo, callback){
    var response = {};
    var templateIds = [];
    var templateExists;
    
    for(i=0; i<templateInfo.bucketTemplates.length; i++){
      templateIds.push(templateInfo.bucketTemplates[i].templateId);
    }

    if(templateIds.indexOf(templateInfo.templateId) > -1){
      templateExists = true;
      callback(null, templateExists);
    } else {
      templateExists = false;
      callback(null, templateExists);
    }
    
  }
  
}