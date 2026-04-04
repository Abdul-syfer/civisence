const issueService = require('./issue.service');
const asyncHandler = require('../../utils/asyncHandler');
const { validationResult } = require('express-validator');

exports.createIssue = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, error: errors.array() });
    }
    const imageUrl = req.imageUrl || req.body.imageUrl || '';
    const data = { ...req.body, imageUrl, createdBy: req.user.id };
    const issue = await issueService.createIssue(data);
    res.status(201).json({ success: true, data: issue });
});

exports.getIssues = asyncHandler(async (req, res) => {
    const issues = await issueService.getIssues(req.query);
    res.json(issues);
});

exports.getIssue = asyncHandler(async (req, res) => {
    const issue = await issueService.getIssueById(req.params.id);
    if (!issue) {
        return res.status(404).json({ error: 'Issue not found.' });
    }
    res.json(issue);
});

exports.updateStatus = asyncHandler(async (req, res) => {
    const issue = await issueService.updateStatus(req.params.id, req.body.status);
    res.json(issue);
});

exports.getMyReports = asyncHandler(async (req, res) => {
    const issues = await issueService.getMyReports(req.user.id);
    res.json(issues);
});
