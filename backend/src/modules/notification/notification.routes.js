const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth.middleware');
const notificationController = require('./notification.controller');

router.use(auth); // Requires authentication for all routes

router.get('/', notificationController.getNotifications);
router.patch('/:id/read', notificationController.markAsRead);

module.exports = router;
