const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth.middleware');
const { body } = require('express-validator');
const confirmationController = require('./confirmation.controller');

router.post('/',
    auth,
    [
        body('issueId').notEmpty().withMessage('Issue ID is required'),
        body('resolved').optional().isBoolean().withMessage('Resolved must be boolean')
    ],
    confirmationController.confirmIssue
);

module.exports = router;
