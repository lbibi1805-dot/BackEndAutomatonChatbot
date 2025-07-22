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

    static async exportAutomaton(req: Request, res: Response) {
        try {
            console.log('Export request received');
            console.log('Headers:', req.headers);
            console.log('User from middleware:', req.user);
            console.log('Body:', req.body);
            
            const userId = req.user?.userId;
            if (!userId) {
                console.log('No userId found, sending 401');
                return res.status(401).json({ error: 'User not authenticated' });
            }

            const { automaton, cfg } = req.body;

            let exportContent = '';
            let filename = '';

            if (automaton) {
                console.log('Processing automaton export');
                const exportData = AutomatonService.formatAutomatonForExport(automaton);
                exportContent = exportData.content;
                filename = exportData.filename;
            } else if (cfg) {
                console.log('Processing CFG export');
                const exportData = AutomatonService.formatCFGForExport(cfg);
                exportContent = exportData.content;
                filename = exportData.filename;
            } else {
                console.log('No automaton or CFG data provided');
                return res.status(400).json({ error: 'No automaton or CFG data provided' });
            }

            console.log('Setting headers for file download');
            // Set appropriate headers for file download
            res.setHeader('Content-Type', 'text/plain');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.send(exportContent);
        } catch (error: any) {
            console.error('Export error:', error);
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