const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema(
  {
    sentiment: { type: String, enum: ['up', 'down'], required: true },
    message: { type: String, required: true },
    question: { type: String },
    conversationHistory: { type: Array, default: [] },
    meta: { type: Object, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Feedback || mongoose.model('Feedback', FeedbackSchema);


