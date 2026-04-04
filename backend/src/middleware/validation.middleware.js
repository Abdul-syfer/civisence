const { sanitizeBody } = require('express-validator');

module.exports = {
    sanitizeAll: [
        sanitizeBody('*').escape(),
    ]
};
