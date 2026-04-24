const http = require('http');
const app = require('./app');
const env = require('./config/env');
const connectDB = require('./config/db');
const socketConfig = require('./socket/socket');

const server = http.createServer(app);

// Initialize Socket.io
socketConfig.init(server);

// Connect to Database (Optional/Background)
connectDB().catch(err => console.warn('Disabling MongoDB features: ' + err.message));

// Start Server
server.listen(env.PORT, () => {
    console.log(`Backend utility server running on port ${env.PORT}`);
    console.log(`Cloudinary Proxy: Active`);
});