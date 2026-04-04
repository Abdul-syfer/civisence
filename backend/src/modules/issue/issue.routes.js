const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth.middleware');
const authorize = require('../../middleware/authorize.middleware');
const { uploadMemory, cloudinaryUpload } = require('../../middleware/upload.middleware');
const { body } = require('express-validator');

const {
    createIssue,
    getIssues,
    getIssue,
    updateStatus,
    getMyReports
} = require('./issue.controller');

// Important: Specific routes like /my-reports should come before parameter routes like /:id
router.get('/my-reports', auth, getMyReports);

// Upload for Cloudinary storage
router.post('/upload', auth, uploadMemory.single('image'), cloudinaryUpload, (req, res) => {
    if (!req.imageUrl) return res.status(400).json({ success: false, error: 'No file uploaded or upload failed' });
    res.json({ success: true, url: req.imageUrl });
});

router.post('/',
    auth,
    uploadMemory.single('image'),
    cloudinaryUpload,
    [
        body('title').trim().notEmpty().withMessage('Title is required'),
        body('category').trim().notEmpty().withMessage('Category is required'),
        body('location').trim().notEmpty().withMessage('Location is required'),
        body('severity').optional().isIn(['severe', 'medium', 'minor']).withMessage('Invalid severity'),
        body('lat').optional().isNumeric().withMessage('Latitude must be a number'),
        body('lng').optional().isNumeric().withMessage('Longitude must be a number'),
    ],
    createIssue
);

router.get('/', getIssues);
router.get('/:id', getIssue);

// Only authorities and admins can update the status (resolve/reject issues)
router.patch('/:id/status', auth, authorize('authority', 'admin'), updateStatus);

module.exports = router;
