require('dotenv').config();

const env = {
    PORT: process.env.PORT || 5000,
    MONGODB_URI: process.env.MONGODB_URI,
    JWT_SECRET: process.env.JWT_SECRET,
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
};

// Basic validation
const required = ['MONGODB_URI', 'JWT_SECRET'];
for (const key of required) {
    if (!env[key]) {
        console.error(`Missing required environment variable: ${key}`);
        process.exit(1);
    }
}

module.exports = env;
