const multer = require('multer');
// Ensure no disk storage is required
// Memory storage for Cloudinary streaming
const storageMemory = multer.memoryStorage();
const uploadMemory = multer({ 
    storage: storageMemory,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit for Cloudinary
});

const cloudinaryUpload = async (req, res, next) => {
    if (!req.file) return next();
    try {
        const cloudinary = require('../config/cloudinary');
        const stream = cloudinary.uploader.upload_stream(
            { resource_type: 'auto', folder: 'civic_sense_uploads' },
            (error, result) => {
                if (error) return next(error);
                req.imageUrl = result.secure_url;
                next();
            }
        );
        stream.end(req.file.buffer);
    } catch (err) {
        console.error('Cloudinary upload failure:', err);
        return res.status(500).json({ success: false, error: 'Image upload failed.' });
    }
};

module.exports = { uploadMemory, cloudinaryUpload };
