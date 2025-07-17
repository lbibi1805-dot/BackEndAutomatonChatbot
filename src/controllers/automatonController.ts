import { Request, Response } from 'express';
import { Automaton } from '../interfaces/automaton';
import { CFG } from '../interfaces/cfg';
import { AutomatonService } from '../services/automatonService';

export class AutomatonController {
    static async processInput(req: Request, res: Response) {
        try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const { type, states, alphabet, transitions, initialState, acceptStates, variables, terminals, productions, startSymbol, question, conversationId } = req.body;

        let automaton: Automaton | undefined;
        let cfg: CFG | undefined;

        if (type && states && alphabet && transitions && initialState && acceptStates) {
            automaton = { type, states, alphabet, transitions, initialState, acceptStates };
        } else if (variables && terminals && productions && startSymbol) {
            cfg = { variables, terminals, productions, startSymbol };
        }

        if (!question) {
            return res.status(400).json({ error: 'Question is required' });
        }

        const result = await AutomatonService.processInput(userId, question, automaton, cfg, conversationId);
        res.json(result);
        } catch (error: any) {
        if (error.response?.status === 503) {
            res.status(503).json({ error: 'The Gemini API is currently overloaded. Please try again in a few minutes.' });
        } else {
            res.status(400).json({ error: error.message });
        }
        }
    }

    static async getConversationHistory(req: Request, res: Response) {
        try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const conversations = await AutomatonService.getConversationHistory(userId);
        res.json(conversations);
        } catch (error: any) {
        res.status(500).json({ error: error.message });
        }
    }

    static async updateConversationName(req: Request, res: Response) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return res.status(401).json({ error: 'User not authenticated' });
            }
            const { conversationId } = req.params;
            const { name } = req.body;
            
            if (!name || name.trim().length === 0) {
                return res.status(400).json({ error: 'Name is required' });
            }
            
            const updatedConversation = await AutomatonService.updateConversationName(userId, conversationId, name.trim());
            res.json(updatedConversation);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    static async deleteConversation(req: Request, res: Response) {
        try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const { conversationId } = req.params;
        await AutomatonService.deleteConversation(userId, conversationId);
        res.json({ message: 'Conversation deleted successfully' });
        } catch (error: any) {
        res.status(400).json({ error: error.message });
        }
    }
}