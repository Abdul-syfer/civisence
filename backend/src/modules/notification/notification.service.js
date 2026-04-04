const Notification = require('./notification.model');
const socketEvents = require('../../socket/events');

class NotificationService {
    async createNotification({ userId, type, title, message, meta }) {
        const notification = await Notification.create({ user: userId, type, title, message, meta });

        // Emit via socket using the cleanly decoupled events layer
        socketEvents.sendNotificationToUser(userId, notification);

        return notification;
    }

    async getUserNotifications(userId) {
        return await Notification.find({ user: userId }).sort({ createdAt: -1 });
    }

    async markAsRead(notificationId, userId) {
        const notification = await Notification.findOneAndUpdate(
            { _id: notificationId, user: userId },
            { read: true },
            { new: true }
        );
        if (!notification) throw new Error('Notification not found.');
        return notification;
    }
}

module.exports = new NotificationService();
