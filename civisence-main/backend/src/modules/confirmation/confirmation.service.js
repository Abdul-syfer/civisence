const Confirmation = require('./confirmation.model');
const Issue = require('../issue/issue.model');
const calculateTrendingScore = require('../../utils/trending');

class ConfirmationService {
    async confirmIssue(userId, issueId, resolved) {
        let confirmation;
        try {
            confirmation = await Confirmation.create({ issue: issueId, user: userId, resolved: !!resolved });
        } catch (err) {
            if (err.code === 11000) {
                throw new Error('Already confirmed.');
            }
            throw err;
        }

        // Atomic update to limit race conditions
        const update = resolved ? { $inc: { resolvedConfirmCount: 1 } } : { $inc: { confirmCount: 1 } };
        const issue = await Issue.findByIdAndUpdate(issueId, update, { new: true });

        // Update trendingScore
        if (issue) {
            issue.trendingScore = calculateTrendingScore(issue);
            await issue.save();
        }

        return confirmation;
    }
}

module.exports = new ConfirmationService();
