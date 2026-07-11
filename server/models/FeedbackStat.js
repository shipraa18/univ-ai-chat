const mongoose = require('mongoose');

const FeedbackStatSchema = new mongoose.Schema(
  {
    messageHash: { type: String, required: true, index: true, unique: true },
    upCount: { type: Number, default: 0 },
    downCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.models.FeedbackStat || mongoose.model('FeedbackStat', FeedbackStatSchema);


