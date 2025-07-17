import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/userModel';

export class AuthService {
    static async register(username: string, password: string) {
        const existingUser = await User.findOne({ username, isDeleted: false });
        if (existingUser) {
        throw new Error('Username already exists');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, password: hashedPassword });
        await user.save();

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'your_jwt_secret_here', {
        expiresIn: '1h',
        });
        return { token };
    }

    static async login(username: string, password: string) {
        const user = await User.findOne({ username, isDeleted: false });
        if (!user) {
        throw new Error('Invalid username or password');
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
        throw new Error('Invalid username or password');
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'your_jwt_secret_here', {
        expiresIn: '1h',
        });
        return { token };
    }
}