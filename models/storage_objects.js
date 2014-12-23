var mongoose = require('mongoose');
var Schema = mongoose.Schema,
ObjectId = Schema.ObjectId;

var metadataSchema = new Schema({
	"key" : { type: String, required: false },
	"value" : { type: String, required: false }
}, { collection: 'metadata'});

var filesSchema = new Schema({
	"fileLocation" : { type: String, unique: true, required: false },
	"readPermssions" : [{ type: String, required: true }],
	"writePermssions" : [{ type: String, required: true }],
	"metadata" : [metadataSchema],
	"createdDate" : { type: Date, required: false },
	"modifiedDate" : { type: Date, required: false }
}, { collection: 'files'});

var storageObjectsSchema = new Schema({
	"bucketId" : { type: String, unique: true, required: true },
	"readPermssions" : [{ type: String, required: true }],
	"writePermssions" : [{ type: String, required: true }],
	"metadata" : [metadataSchema],
	"files" : [filesSchema],
	"createdDate" : { type: Date, required: false },
	"modifiedDate" : { type: Date, required: false }
}, { collection: 'storageObjects'});

StorageObjects = mongoose.model('storageObjects', storageObjectsSchema);

module.exports = StorageObjects;