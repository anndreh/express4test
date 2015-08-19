// get an instance of mongoose and mongoose.Schema
var mongoose   = require('mongoose');
var Schema     = mongoose.Schema;

var BearSchema = new Schema({
  name: String
});

module.exports = mongoose.model('Bear', BearSchema);