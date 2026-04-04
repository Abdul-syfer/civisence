const User = require('./user.model');

class UserService {
    async findByEmail(email) {
        return await User.findOne({ email });
    }

    async createUser(userData) {
        return await User.create(userData);
    }

    async findById(id) {
        return await User.findById(id).select('-password');
    }

    async getUsersByRole(role) {
        return await User.find({ role });
    }
}

module.exports = new UserService();
