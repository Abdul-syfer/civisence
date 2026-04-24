const socketConfig = require('./socket');

module.exports = {
    sendNotificationToUser: (userId, notificationData) => {
        try {
            const io = socketConfig.getIo();
            const userSockets = socketConfig.getUserSockets();
            const socketId = userSockets.get(userId.toString());

            if (socketId) {
                // Determine explicit detailed event name mapped from type
                const eventName = notificationData.type === 'new_issue' ? 'new_issue_in_ward' :
                    notificationData.type === 'resolution' ? 'issue_resolved' :
                        notificationData.type === 'issue_update' ? 'issue_updated' : 'notification';

                // Emit custom detailed event
                io.to(socketId).emit(eventName, notificationData);
                // Fallback: Always emit generic global notification
                io.to(socketId).emit('notification', notificationData);
            }
        } catch (err) {
            console.error('Socket emit error:', err.message);
        }
    }
};
