var mongoose = require('mongoose');
var Schema = mongoose.Schema,
ObjectId = Schema.ObjectId;

var metadataSchema = new Schema({
	"key" : { type: String, required: false },
	"value" : { type: String, required: false }
});

var templatesSchema = new Schema({
	"templateId" : { type: String },
	"readPermssions" : [{ type: String, required: false }],
	"writePermssions" : [{ type: String, required: false }],
	"templateMetadata" : [metadataSchema],
	"templateBody" : Schema.Types.Mixed,
	"templateSchema" : Schema.Types.Mixed,
	"templateMediaType" : { type: String },
	"templateLanguage" : { type: String },
	"paperFormat" : { type: String },
	"paperOrientation" : { type: String },
	"paperWidth" : { type: Number },
	"paperHeight" : { type: Number },
	"createdDate" : { type: Date, required: false },
	"modifiedDate" : { type: Date, required: false }
});

var bucketsSchema = new Schema({
	"bucketId" : { type: String, unique: true, required: true },
	"readPermissions" : [{ type: String, required: true }],
	"writePermissions" : [{ type: String, required: true }],
	"originalOwner" : { type: String, required: false },
	"metadata" : [metadataSchema],
	"templates" : [templatesSchema],
	"createdDate" : { type: Date, required: false },
	"modifiedDate" : { type: Date, required: false }
}, { collection: 'buckets'});

Buckets = mongoose.model('buckets', bucketsSchema);

module.exports = Buckets;