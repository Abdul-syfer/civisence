const express = require('express');
const path = require('path');
const cors = require('cors');
const rateLimit = require('./middleware/rateLimit.middleware');
const errorHandler = require('./middleware/error.middleware');

// Routes
const authRoutes = require('./modules/auth/auth.routes');
const issueRoutes = require('./modules/issue/issue.routes');
const confirmationRoutes = require('./modules/confirmation/confirmation.routes');
const notificationRoutes = require('./modules/notification/notification.routes');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));
app.use(rateLimit);

// Simple Request Logger
app.use((req, res, next) => {
    console.log(`[INFO] ${new Date().toISOString()} | ${req.method} ${req.url}`);
    next();
});

// API Version 1
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/issues', issueRoutes);
app.use('/api/v1/confirmations', confirmationRoutes);
app.use('/api/v1/notifications', notificationRoutes);

app.use(errorHandler);

module.exports = app;
