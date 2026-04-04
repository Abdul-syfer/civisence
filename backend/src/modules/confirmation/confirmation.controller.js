const confirmationService = require('./confirmation.service');
const asyncHandler = require('../../utils/asyncHandler');
const { validationResult } = require('express-validator');

exports.confirmIssue = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, error: errors.array() });
    }

    const { issueId, resolved } = req.body;
    if (!issueId) {
        return res.status(400).json({ success: false, error: 'Issue ID required.' });
    }

    const confirmation = await confirmationService.confirmIssue(req.user.id, issueId, resolved);
    res.status(201).json({ success: true, data: confirmation });
});
