var mongoose = require('mongoose');
var Schema = mongoose.Schema,
ObjectId = Schema.ObjectId;

var metadataSchema = new Schema({
	"key" : { type: String, required: false },
	"value" : { type: String, required: false }
});

var templatesSchema = new Schema({
	"templateId" : { type: String, unique: true, required: true },
	"readPermssions" : [{ type: String, required: true }],
	"writePermssions" : [{ type: String, required: true }],
	"metadata" : [metadataSchema],
	"bucket" : {
		"bucketId" : { type: String },
		"readPermssions" : [{ type: String, required: false }],
		"writePermssions" : [{ type: String, required: false }],
		"createdDate" : { type: Date, required: false },
		"modifiedDate" : { type: Date, required: false }
	},
	"createdDate" : { type: Date, required: false },
	"modifiedDate" : { type: Date, required: false }
}, { collection: 'templates'});

Templates = mongoose.model('templates', templatesSchema);

module.exports = Templates;