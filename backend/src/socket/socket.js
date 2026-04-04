const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const env = require('../config/env');

let io;
const userSockets = new Map(); // Maps userId to socketId

module.exports = {
    init: (server) => {
        io = socketIo(server, {
            cors: { origin: '*' }
        });

        // Middleware to safely authenticate socket connections
        io.use((socket, next) => {
            const token = socket.handshake.auth?.token;
            if (!token) return next(new Error('Authentication Error'));

            try {
                const decoded = jwt.verify(token, env.JWT_SECRET);
                socket.user = decoded;
                next();
            } catch (err) {
                next(new Error('Authentication Error'));
            }
        });

        io.on('connection', (socket) => {
            const userId = socket.user.id;

            // Overwrite cleanly to handle multiple tabs/reconnects predictably
            userSockets.set(userId, socket.id);
            console.log(`[Socket] User connected: ${userId} (${socket.id})`);

            socket.on('disconnect', () => {
                // Ensure we only delete if the disconnected socket is the active one
                if (userSockets.get(userId) === socket.id) {
                    userSockets.delete(userId);
                }
                console.log(`[Socket] User disconnected: ${userId} (${socket.id})`);
            });
        });

        return io;
    },
    getIo: () => {
        if (!io) throw new Error("Socket.io not initialized!");
        return io;
    },
    getUserSockets: () => userSockets
};
