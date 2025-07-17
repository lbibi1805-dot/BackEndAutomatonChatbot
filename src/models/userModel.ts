import mongoose, { Schema } from 'mongoose';
import { User } from '../interfaces/user';

const userSchema = new Schema<User>({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    isDeleted: { type: Boolean, default: false },
});

export default mongoose.model<User>('User', userSchema);