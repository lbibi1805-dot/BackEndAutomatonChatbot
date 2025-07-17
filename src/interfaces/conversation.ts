import { Automaton } from './automaton';
import { CFG } from './cfg';

export interface Message {
    question: string;
    response: string;
    graphvizCode?: string; // Thêm trường tùy chọn
    createdAt: Date;
}

export interface Conversation {
    userId: string;
    name?: string; // Optional conversation name
    automaton?: Automaton;
    cfg?: CFG;
    messages: Message[];
    createdAt: Date;
    isDeleted: boolean;
}