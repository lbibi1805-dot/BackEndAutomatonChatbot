import mongoose, { Schema } from 'mongoose';
import { Conversation } from '../interfaces/conversation';

const conversationSchema = new Schema<Conversation>({
    userId: { type: String, required: true },
    name: { type: String, default: '' }, // Name for the conversation
    automaton: {
        type: {
        type: String,
        enum: ['DFA', 'NFA', 'PDA'],
        },
        states: { type: [String] },
        alphabet: { type: [String] },
        transitions: { type: [[String]] },
        initialState: { type: String },
        acceptStates: { type: [String] },
        question: { type: String },
    },
    cfg: {
        variables: { type: [String] },
        terminals: { type: [String] },
        productions: { type: Schema.Types.Mixed },
        startSymbol: { type: String },
    },
    messages: [
        {
        question: { type: String, required: true },
        response: { type: String, required: true },
        graphvizCode: { type: String, default: '' }, // Thêm trường lưu code Graphviz
        createdAt: { type: Date, default: Date.now },
        },
    ],
    createdAt: { type: Date, default: Date.now },
    isDeleted: { type: Boolean, default: false },
});

export default mongoose.model<Conversation>('Conversation', conversationSchema);