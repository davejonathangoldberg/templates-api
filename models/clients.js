var mongoose = require('mongoose');
var Schema = mongoose.Schema,
ObjectId = Schema.ObjectId;

var clientsSchema = new Schema({
	"id" : { type: String, unique: true, required: true },
	"user" : { type: String, required: false },
	"pass" : { type: String, required: false },
	"clientKey" : { type: String, unique: true, required: false },
	"createdDate" : { type: Date, required: false },
	"modifiedDate" : { type: Date, required: false }
}, { collection: 'clients'});

Clients = mongoose.model('clients', clientsSchema);

module.exports = Clients;