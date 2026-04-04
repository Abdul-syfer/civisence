const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const env = require('../../config/env');
const userService = require('../user/user.service');

class AuthService {
    async register({ email, password, name }) {
        if (!email || !password) throw new Error('Email and password required.');
        const existing = await userService.findByEmail(email);
        if (existing) throw new Error('Email already registered.');

        const hash = await bcrypt.hash(password, 10);
        const user = await userService.createUser({ email, password: hash, name });

        const token = this.generateToken(user);
        return { token, user: { id: user._id, email: user.email, name: user.name, role: user.role } };
    }

    async login({ email, password }) {
        if (!email || !password) throw new Error('Email and password required.');
        const user = await userService.findByEmail(email);
        if (!user) throw new Error('Invalid credentials.');

        const match = await bcrypt.compare(password, user.password);
        if (!match) throw new Error('Invalid credentials.');

        const token = this.generateToken(user);
        return { token, user: { id: user._id, email: user.email, name: user.name, role: user.role } };
    }

    generateToken(user) {
        return jwt.sign({ id: user._id, email: user.email, role: user.role }, env.JWT_SECRET, { expiresIn: '7d' });
    }
}

module.exports = new AuthService();
