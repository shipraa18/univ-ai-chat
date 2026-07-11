const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
  content: { type: String, required: true },
}, { _id: false });

const ChatSchema = new mongoose.Schema({
  messages: { type: [MessageSchema], default: [] },
}, { timestamps: true });

module.exports = mongoose.model('Chat', ChatSchema);


