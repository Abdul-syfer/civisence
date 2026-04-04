const mongoose = require('mongoose');

const confirmationSchema = new mongoose.Schema({
    issue: { type: mongoose.Schema.Types.ObjectId, ref: 'Issue', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    confirmedAt: { type: Date, default: Date.now },
    resolved: { type: Boolean, default: false },
});

confirmationSchema.index({ user: 1, issue: 1, resolved: 1 }, { unique: true });

module.exports = mongoose.model('Confirmation', confirmationSchema);
