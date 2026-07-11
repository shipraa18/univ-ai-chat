const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
  content: { type: String, required: true },
}, { _id: false });

const SharedChatSchema = new mongoose.Schema({
  shareId: { type: String, unique: true, index: true },
  sourceChat: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: false },
  messages: { type: [MessageSchema], default: [] },
}, { timestamps: true });

module.exports = mongoose.model('SharedChat', SharedChatSchema);


