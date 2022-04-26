const mongoose = require('mongoose');

const {
  Schema: {
    Types: { ObjectId },
  },
} = mongoose;

const codeSchema = new mongoose.Schema({
  code: {
    type: Number,
    required: true,
  },
  user: {
    type: ObjectId,
    ref: 'User',
    required: true,
  },
});

module.exports = mongoose.model('Code', codeSchema);
