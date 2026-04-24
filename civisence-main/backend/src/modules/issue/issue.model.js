const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
    title: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String },
    location: { type: String, required: true },
    ward: { type: String },
    lat: { type: Number },
    lng: { type: Number },
    severity: { type: String, enum: ['severe', 'medium', 'minor'], default: 'medium' },
    status: { type: String, enum: ['open', 'in_progress', 'resolved', 'rejected'], default: 'open', index: true },
    reportCount: { type: Number, default: 1 },
    confirmCount: { type: Number, default: 0, index: true },
    resolvedConfirmCount: { type: Number, default: 0 },
    trendingScore: { type: Number, default: 0 },
    department: { type: String },
    reportedAt: { type: Date, default: Date.now, index: true },
    imageUrl: { type: String },
    assignedOfficer: { type: String },
    timeline: [{ label: String, date: String, done: Boolean }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

issueSchema.index({ status: 1 });
issueSchema.index({ createdAt: 1 });
issueSchema.index({ confirmCount: -1 });

module.exports = mongoose.model('Issue', issueSchema);
