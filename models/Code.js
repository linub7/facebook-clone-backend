const mongoose = require('mongoose');

const {
  Schema: { ObjectId },
} = mongoose;

const codeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
  },
  user: {
    type: ObjectId,
    ref: 'User',
    required: true,
  },
});

module.exports = mongoose.model('Code', codeSchema);
