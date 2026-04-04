const notificationService = require('./notification.service');
const asyncHandler = require('../../utils/asyncHandler');

exports.getNotifications = asyncHandler(async (req, res) => {
    const notifications = await notificationService.getUserNotifications(req.user.id);
    res.json({ success: true, data: notifications });
});

exports.markAsRead = asyncHandler(async (req, res) => {
    const notification = await notificationService.markAsRead(req.params.id, req.user.id);
    res.json({ success: true, data: notification });
});
