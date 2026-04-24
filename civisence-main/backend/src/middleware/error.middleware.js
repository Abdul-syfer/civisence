module.exports = (err, req, res, next) => {
    // Basic Error logging
    console.error(`[ERROR] ${new Date().toISOString()} | ${req.method} ${req.url}`);
    console.error(err.stack || err);

    let statusCode = err.statusCode || 500;

    // Quick automated mapping of common string assertions
    if (err.message) {
        const msg = err.message.toLowerCase();
        if (msg.includes('not found')) statusCode = 404;
        else if (msg.includes('already') || err.code === 11000) statusCode = 409;
        else if (msg.includes('invalid') || msg.includes('required')) statusCode = 400;
        else if (msg.includes('denied') || msg.includes('forbidden')) statusCode = 403;
        else if (msg.includes('unauthorized') || msg.includes('token')) statusCode = 401;
    }

    res.status(statusCode).json({
        success: false,
        error: err.message || 'Internal Server Error',
    });
};
