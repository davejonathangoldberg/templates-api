// index.js: composition root

// REQUIRED LIBRARIES
var http = require('http');
var basicAuth = require('basic-auth');
// REQUIRED CLASSES
var App = require("./app.js");
var Database = require('./Database.js');
var dbConfig = require('./dbconfig.json');
var Composer = require('./lib/composer.js');
var AuthCheck = require('./lib/authcheck.js');
var Utility = require('./lib/utility.js');
  
// CLASS INSTANTIATION
var app = new App();
var database = new Database(dbConfig);
var composer = new Composer(app);
var authCheck = new AuthCheck(app);
var utility = new Utility(app);
var config = require('./lib/config.js');

// ESTABLISH ROUTE CLASSES & ROUTES
//var Routes = require('./routes');
//var routes = new Routes(app);

var auth = function (req, res, next) {
  req.user = basicAuth(req);
  var clientInfo = {};
  
  function unauthorized(res) {
    res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
    return res.sendStatus(403);
  };
  
  function unauthenticated(res) {
    res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
    return res.sendStatus(401);
  };

  if(typeof(req.user) == 'undefined'){
    return unauthenticated(res);
  } else if (typeof(req.user.name) == 'undefined' || typeof(req.user.pass) == 'undefined') {
    return unauthenticated(res);
  };

    // SPECIAL HANDLING FOR CREATING CLIENTS
  
  if(req.path == '/clients' && ((req.method == 'POST') || (req.method == 'GET'))){
    if (req.user.name === config.superUserName && req.user.pass === config.superUserPass) {
      return next();
    } else {
      return unauthorized(res);
    };
  } else {
    clientInfo['clientKey'] = req.user.name || 'nokey';
    composer.checkClient(clientInfo, function(err, client){
    if(err){
      if(err.code == 500) {
        return res.status(500);
      } else {
        return res.status(400).json(err);
      } 
    } else if(client.instance == ''){
      return unauthorized(res);
    } else {
      return next();
    }
  });
  };
    

};

// CREATE API CLIENT
app.post('/clients', auth, function(req, res, next){
  var clientData = {};
  composer.addClient(clientData, function(err, msg){
    if(err){
      if(err.code == 500) {
        return res.status(500);
      } else {
        return res.status(400).json(err);
      } 
    } else {
      res.set('content-type', 'application/json');
      return res.status(201).json({ "clientId" : msg['clientKey']});
    }
  });
});

// RETRIEVE API CLIENTS
app.get('/clients', auth, function(req,res,next){
  var clientData = [];
  composer.getClients(clientData, function(err, clients){
    if(err){
      if(err.code == 500) {
        return res.status(500);
      } else {
        return res.status(400).json(err);
      } 
    } else {
      res.set('content-type', 'application/json');
      return res.status(200).json(clients);
    }
  });
})


// BUCKET OPERATIONS
app.get('/buckets/:bucket', auth, function(req, res, next){ //RETRIEVE BUCKET METADATA
  var bucketInfo = {};
  var readPermissions = [];
  var writePermissions = [];
  var checkPermissions = {};
  
  /*
  Lookup bucket in MongoDB
  If it exists
    If authorized
      Retrieve bucket metadata
      send 200 response with bucket metadata and links to templates
    If not authorized
      return 403
  If bucket does not exist
    return 404
  */
  
  // SET BUCKET ID
  bucketInfo['bucketId'] = req.params.bucket;
  bucketInfo['options'] = { 'templates' : 0 }; // EXCLUDE TEMPLATES FROM SEARCH
  composer.lookupBucket(bucketInfo, function(err, bucket){
    if(err){
      if(err.code == 500) {
        return res.status(500).json(err);
      } else {
        return res.status(400).json(err);
      } 
    } else {
      if(bucket.instance == ''){
        return res.status(404);
      } else if(typeof(bucket) == 'object') {
        console.log('Bucket Instance: ' + JSON.stringify(bucket.instance));
        checkPermissions.client = req.user.name;
        checkPermissions.permissions = bucket.instance.readPermissions;
        authCheck.checkClientPermissions(checkPermissions, function(err, authResult){
          if (err){
            if(err.code == 500) {
              return res.status(500).json(err);
            } else {
              return res.status(400).json(err);
            }
          } else {
            if(authResult) {
              utility.bucketResponse(bucket.instance, function(err, bucketResponse){
                if (err){
                  if(err.code == 500) {
                    return res.status(500).json(err);
                  } else {
                    return res.status(400).json(err);
                  }
                } else {   
                  return res.status(200).json(bucketResponse);
                }
              });
            } else {
              res.set('content-type', 'application/json');
              return res.status(403).json({ "errorType" : "Unauthorized", "errorDescription" : "You lack the rights to view this bucket. Please contact the bucket owner." });
            }
          }
        });
      } else {
        return res.status(500);
        console.log('Invalid Bucket Instance');
      }
    }
  });

});

app.get('/buckets/:bucket/templates', auth, function(req, res, next){ //RETRIEVE TEMPLATES IN BUCKET
  var bucketInfo = {};
  var readPermissions = [];
  var writePermissions = [];
  var checkPermissions = {};
  
  /*
  Lookup bucket in MongoDB
  If it exists
    If authorized
      Retrieve list of templates from MongoDB entry array
      send 200 response
    If not authorized
      return 403
  If bucket does not exist
    return 404
  */
  
  // SET BUCKET ID
  bucketInfo['bucketId'] = req.params.bucket;
  bucketInfo['options'] = { 'templates.templateId' : 1, 'readPermissions' : 1 }; // ONLY INCLUDE TEMPLATES AND READ PERMISSIONS FROM SEARCH
  composer.lookupBucket(bucketInfo, function(err, bucket){
    if(err){
      if(err.code == 500) {
        return res.status(500).json(err);
      } else {
        return res.status(400).json(err);
      } 
    } else {
      if(bucket.instance == ''){
        return res.status(404).send();
      } else if(typeof(bucket) == 'object') {
        console.log('Bucket Instance: ' + JSON.stringify(bucket.instance));
        checkPermissions.client = req.user.name;
        checkPermissions.permissions = bucket.instance.readPermissions;
        authCheck.checkClientPermissions(checkPermissions, function(err, authResult){
          if (err){
            if(err.code == 500) {
              return res.status(500).json(err);
            } else {
              return res.status(400).json(err);
            }
          } else {
            if(authResult) {
              utility.bucketTemplatesResponse(bucket.instance, function(err, bucketResponse){
                if (err){
                  if(err.code == 500) {
                    return res.status(500).json(err);
                  } else {
                    return res.status(400).json(err);
                  }
                } else {   
                  return res.status(200).json(bucketResponse);
                }
              });
            } else {
              res.set('content-type', 'application/json');
              return res.status(403).json({ "errorType" : "Unauthorized", "errorDescription" : "You lack the rights to view this bucket. Please contact the bucket owner." });
            }
          }
        });
      } else {
        return res.status(500).send();
        console.log('Invalid Bucket Instance');
      }
    }
  });
  
});

app.put('/buckets/:bucket', auth, function(req, res, next){ //ADD A FILE TO A BUCKET
  var bucketInfo = {};
  var readPermissions = [];
  var writePermissions = [];
  var checkPermissions = {};
  var metadata;
  
  // NEED VALIDATION OF REQUEST BODY HERE
  
  // SET BUCKET METADATA IF PROVIDED
  metadata = req.body.metadata || [];
  
  // SET BASIC READ AND WRITE PERMISSIONS 
  readPermissions.push(req.user.name); // req.user.name comes from Basic Auth Library
  writePermissions.push(req.user.name);
  
  // ADD ADDITIONAL READ AND WRITE PERMISSIONS IF PROVIDED
  if(Array.isArray(req.body.readPermissions)) {
    readPermissions.push.apply(readPermissions, req.body.readPermissions)
  };
  if(Array.isArray(req.body.writePermissions)) {
    writePermissions.push.apply(writePermissions, req.body.writePermissions)
  };
  
  // PREPARE READ AND WRITE PERMISSIONS FOR DB ENTRY
  bucketInfo['readPermissions'] = readPermissions;
  bucketInfo['writePermissions'] = writePermissions;
  
  // PREPARE METADATA FOR DB ENTRY
  bucketInfo['metadata'] = metadata;
  
  // SET BUCKET ID
  bucketInfo['bucketId'] = req.params.bucket;
  
  /*
  Lookup bucket in MongoDB ++
  If it exists
    If client authorized to this bucket.(Check clientId from header against MongoDB write permissions for bucket)
      update entry to MongoDB database ++
      send 200 response ++
    If not valid key
      return 403 ++
  If bucket does not exist ++
    Insert entry into MongoDB. ++
    return 201  ++
  */
  
  composer.lookupBucket(bucketInfo, function(err, bucket){
    if(err){
      if(err.code == 500) {
        return res.status(500).json(err);
      } else {
        return res.status(400).json(err);
      } 
    } else {
      if(bucket.instance == ''){
        composer.insertBucket(bucketInfo, function(err, newBucket){
          if(err){
            if(err.code == 500) {
              return res.status(500).json(err);
            } else {
              return res.status(400).json(err);
            } 
          } else {
            res.set('content-type', 'application/json');
            return res.status(201).json(newBucket.instance);
          }
        });
      } else if(typeof(bucket) == 'object') {
        checkPermissions.client = req.user.name;
        checkPermissions.permissions = bucket.instance.writePermissions;
        authCheck.checkClientPermissions(checkPermissions, function(err, authResult){
          if (err){
            if(err.code == 500) {
              return res.status(500).json(err);
            } else {
              return res.status(400).json(err);
            }
          } else {
            console.log('\nauthResult: ' + authResult);
            if(authResult) {
              bucketInfo['createdDate'] = bucket.instance.createdDate || new Date();
              bucketInfo['modifiedDate'] = new Date();
              composer.updateBucket(bucketInfo, function(err, updatedBucketInfo){
                if(err){
                  if(err.code == 500) {
                    return res.status(500).json(err);
                  } else {
                    return res.status(400).json(err);
                  } 
                } else {
                  res.set('content-type', 'application/json');
                  return res.status(200).json(updatedBucketInfo);
                }
              });
            } else {
              res.set('content-type', 'application/json');
              return res.status(403).json({ "errorType" : "Unauthorized", "errorDescription" : "You lack the rights to update the bucket. Please contact the bucket owner." });
            }
          }
        });
      } else {
        return res.status(500).send();
        console.log('Invalid Bucket Instance');
      }
    }
  });
  
});

// FUTURE FEATURE
app.delete('/buckets/:bucket', function(req, res, next){ // DELETE A BUCKET 
  /*
  Check client authorization. Return 403 if it doesn't find a valid client.
  Lookup bucket in MongoDB
  If it exists
    If client authorized to this bucket.(Check MongoDB authorized headers)
      Delete all templates in bucket 
      remove entry in MongoDB
      send 204 response
    If not valid key
      return 403
  If bucket does not exist
    Return 404
  */
});

// TEMPLATE OPERATIONS
app.get('/buckets/:bucket/templates/:template', function(req, res, next){ //RETRIEVE A TEMPLATE FROM A BUCKET
  /*
  Check client authorization. Return 403 if it doesn't find a valid client.
  Lookup bucket in MongoDB
  If it exists
    If client authorized to READ FROM this bucket.(Check MongoDB authorized headers)
      Check if template exists in bucket
        If it exists
          Check if client is authorized for read access to template
            If authorized
              Retrieve template
              Map template and contents to my response model
              send 200 response
            If not authorized
              return 403
        If it does not exist
          return 404
    If not valid key
      return 403
  If bucket does not exist
    Return 404
  */
});

app.put('/buckets/:bucket/templates/:template', auth, function(req, res, next){ //ADD OR UPDATE A TEMPLATE IN A BUCKET
  console.log('req.body: ' + JSON.stringify(req.body));
  var bucketInfo = {};
  var templateInfo = {};
  var readPermissions = [];
  var writePermissions = [];
  var checkPermissions = {};
  var checkTemplatePermissions = {};
  
  // ADD TEMPLATE NAME AND REQUEST BODY VALIDATION HERE
  
  // SET BUCKET ID
  bucketInfo['bucketId'] = req.params.bucket;
  bucketInfo['options'] = { 'templates.templateId' : 1, 'writePermissions' : 1, 'templates.writePermissions' : 1 }; // EXCLUDE TEMPLATES FROM SEARCH
  
  // SET TEMPLATE DATA
  templateInfo['templateId'] = req.params.template;
  templateInfo['templateBody'] = req.body;
  templateInfo['templateMediaType'] = req.get('Content-Type') || 'text/plain';
  //templateInfo['templateMetadata'] = req.get('Metadata') || '';
  templateInfo['templateLanguage'] = req.get('Content-Language') || 'en';
  templateInfo['paperFormat'] = req.get('X-Paper-Format') || 'Letter';
  templateInfo['paperOrientation'] = req.get('X-Paper-Orientation') || 'portrait';
  templateInfo['paperWidth'] = req.get('X-Paper-Width') || '';
  templateInfo['paperHeight'] = req.get('X-Paper-Height') || '';
  
  
  composer.lookupBucket(bucketInfo, function(err, bucket){
    if(err){
      if(err.code == 500) {
        return res.status(500).json(err);
      } else {
        return res.status(400).json(err);
      } 
    } else {
      if(bucket.instance == ''){
        return res.status(404).send();
      } else if(typeof(bucket) == 'object') { // BUCKET IS FOUND
        console.log('Bucket Instance: ' + JSON.stringify(bucket.instance));
        checkPermissions.client = req.user.name;
        checkPermissions.permissions = bucket.instance.writePermissions;
        authCheck.checkClientPermissions(checkPermissions, function(err, authResult){
          if (err){
            if(err.code == 500) {
              return res.status(500).json(err);
            } else {
              return res.status(400).json(err);
            }
          } else {
            if(authResult) { // CLIENT HAS WRITE PERMISSIONS TO THIS BUCKET
              templateInfo.bucketTemplates = bucket.instance.templates;
              utility.checkTemplateExists(templateInfo, function(err, templateExists) {
                if (err){
                  if(err.code == 500) {
                    return res.status(500).json(err);
                  } else {
                    return res.status(400).json(err);
                  }
                } else {
                  if(templateExists){ // TEMPLATE ALREADY EXISTS
                    checkTemplatePermissions.client = req.user.name;
                    checkTemplatePermissions.permissions = bucket.instance.templates.writePermissions;
                    authCheck.checkClientPermissions(checkPermissions, function(err, templateAuthResult){
                      if (err){
                        if(err.code == 500) {
                          return res.status(500).json(err);
                        } else {
                          return res.status(400).json(err);
                        }
                      } else {
                        if(templateAuthResult){ // CLIENT ALLOWED TO WRITE TO TEMPLATE
                          composer.updateTemplate(templateInfo, bucketInfo, function(err, templateRecord){
                            if (err){
                              if(err.code == 500) {
                                return res.status(500).json(err);
                              } else {
                                return res.status(400).json(err);
                              }
                            } else {
                              return res.status(200).json(templateRecord);
                            }
                          });
                        } else { // CLIENT NOT ALLOWED TO WRITE TO TEMPLATE
                          return res.status(403).json({ "errorType" : "Unauthorized", "errorDescription" : "You lack the rights to edit this template. Please contact the template owner." });
                        }
                      }
                    });
                  } else { // TEMPLATE DOES NOT EXIST
                    console.log('Template Does Not Exist');
                    composer.insertTemplate(templateInfo, bucketInfo, function(err, templateRecord){
                      if (err){
                        if(err.code == 500) {
                          return res.status(500).json(err);
                        } else {
                          return res.status(400).json(err);
                        }
                      } else {
                        return res.status(200).json(templateRecord);
                      }
                    });
                  }
                }
              });
            } else { // CLIENT DOES NOT HAVE WRITE PERMISSION TO THIS BUCKET
              res.set('content-type', 'application/json');
              return res.status(403).json({ "errorType" : "Unauthorized", "errorDescription" : "You lack the rights to view this bucket. Please contact the bucket owner." });
            }
          }
        });
      } else {
        return res.status(500).send();
        console.log('Invalid Bucket Instance');
      }
    }
  });
  
  /*
  validate template name & template media-type
  Lookup bucket in MongoDB ++
  If it exists 
    If client authorized to this WRITE TO this bucket.(Check MongoDB authorized headers)
      Check if template exists in bucket ++
        If it exists ++
          Check if client is authorized for WRITE access to template
            If authorized
              Insert template
              update template schema if necessary (different fields)
              Compose response headers (Etag, Authorization headers)
              send 200 response
            If not authorized
              return 403
        If it does not exist 
          Insert template ++
            Insert permissions
            Insert media type
            Insert metadata
            Insert language
          Insert template schema
          Compose response headers (Etag, Location, Authorization headers)
          return 201
    If not authorized for bucket WRITE ++
      return 403 ++
  If bucket does not exist ++
    Return 404 ++
  */
});

app.post('/buckets/:bucket/templates/:template', function(req, res, next){ // GENERATE DOCUMENT FROM TEMPLATE
  /*
  Check client authorization. Return 403 if it doesn't find a valid client.
  validate template name, 400 if invalid
  Lookup bucket in MongoDB
  If it exists
    If client authorized to this READ FROM this bucket.(Check MongoDB authorized headers)
      Check if template exists in bucket
        If it exists
          Check if client is authorized for READ access to template
            If authorized
              validate input fields against schema
                If valid
                  Check desired content type and generate output template
                  send 200 response with filled out template in the body
                If invalid
                  Compose validation error details
                  Return 400 with validation error details
            If not authorized
              return 403
        If it does not exist
          return 404
    If not authorized for bucket READ
      return 403
  If bucket does not exist
    Return 404
  */
});

app.get('/buckets/:bucket/templates/:template/schema', function(req, res, next){ //RETRIEVE A TEMPLATE SCHEMA 
  /*
  Check client authorization. Return 403 if it doesn't find a valid client.
  validate template name, 400 if invalid
  Lookup bucket in MongoDB
  If it exists
    If client authorized to READ FROM this bucket.(Check MongoDB authorized headers)
      Check if template exists in bucket
        If it exists
          Check if client is authorized for read access to template
            If authorized
              Retrieve template schema
              Map template schema to my response model
              send 200 response
            If not authorized
              return 403
        If it does not exist
          return 404
    If not valid key
      return 403
  If bucket does not exist
    Return 404
  */
});

app.put('/buckets/:bucket/templates/:template/schema', function(req, res, next){ // UPDATE A TEMPLATE SCHEMA
  /*
  Check client authorization. Return 403 if it doesn't find a valid client.
  validate template name, 400 if invalid
  Lookup bucket in MongoDB
  If it exists
    If client authorized to this WRITE TO this bucket.(Check MongoDB authorized headers)
      Check if template exists in bucket
        If it exists
          Check if client is authorized for WRITE access to template
            If authorized
              Validate template schema
                If valid
                  Insert template schema
                  Compose response headers (Etag, Authorization headers)
                  send 200 response
                Else
                  Compose schema validation error detail
                  Return 400
            If not authorized
              return 403
        If it does not exist
          return 404
    If not authorized for bucket WRITE
      return 403
  If bucket does not exist
    Return 404
  */
});


// FUTURE FEATURE DO NOT IMPLEMENT
app.delete('/buckets/:bucket/templates/:template', function(req, res, next){ // DELETE A TEMPLATE FROM A BUCKET
    /*
  Check client authorization. Return 403 if it doesn't find a valid client.
  validate template name, 400 if invalid
  Lookup bucket in MongoDB
  If it exists
    If client authorized to this WRITE TO this bucket.(Check MongoDB authorized headers)
      Check if template exists in bucket
        If it exists
          Check if client is authorized for WRITE access to template
            If authorized
              Remove file entry from MongoDB bucket entry
              Remove file (deleteObject method S3 SDK)
              send 200 response
            If not authorized
              return 403
        If it does not exist
          return 404
    If not authorized for bucket WRITE
      return 403
  If bucket does not exist
    Return 404
  */
});


app.all('*', function(req, res){
  var errorMessage = "Invalid or Unsupported Request. Please check your input and try again.";
  var errorTemplate = { "requestRoute" : req.path, "message" : errorMessage };
  res.set('Content-Type', app.mediaType);
  res.statusCode = 400;
  res.status(400).json(errorTemplate);
}); // RETURN ERROR FOR ANYTHING THAT OTHERWISE HASN'T BEEN CAUGHT