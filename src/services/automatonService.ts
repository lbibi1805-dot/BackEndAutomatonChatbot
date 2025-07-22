import { Automaton } from '../interfaces/automaton';
import { CFG } from '../interfaces/cfg';
import Conversation from '../models/conversationModel';
import { LLMService } from './llmService';

export class AutomatonService {
    static validateAutomaton(automaton: Automaton): string {
        const { type, states, alphabet, transitions, initialState, acceptStates } = automaton;

        if (!type || !states || !alphabet || !transitions || !initialState || !acceptStates) {
        throw new Error('Missing required fields for automaton');
        }

        let response = `Received ${type} automaton:\n`;
        response += `States: ${states.join(', ')}\n`;
        response += `Alphabet: ${alphabet.join(', ')}\n`;
        response += `Initial State: ${initialState}\n`;
        response += `Accept States: ${acceptStates.join(', ')}\n`;
        response += `Transitions:\n`;

        for (const [state, symbol, nextState] of transitions) {
        if (!states.includes(state) || !states.includes(nextState) || !alphabet.includes(symbol)) {
            throw new Error(`Invalid transition: ${state}, ${symbol}, ${nextState}`);
        }
        response += `${state} --${symbol}--> ${nextState}\n`;
        }

        if (!states.includes(initialState)) {
        throw new Error('Invalid initial state');
        }
        if (!acceptStates.every((s: string) => states.includes(s))) {
        throw new Error('Invalid accept state(s)');
        }

        return response;
    }

    static validateCFG(cfg: CFG): string {
        const { variables, terminals, productions, startSymbol } = cfg;

        if (!variables || !terminals || !productions || !startSymbol) {
        throw new Error('Missing required fields for CFG');
        }

        let response = `Received CFG:\n`;
        response += `Variables: ${variables.join(', ')}\n`;
        response += `Terminals: ${terminals.join(', ')}\n`;
        response += `Start Symbol: ${startSymbol}\n`;
        response += `Productions:\n`;

        for (const [variable, prods] of Object.entries(productions)) {
        if (!variables.includes(variable)) {
            throw new Error(`Invalid variable in productions: ${variable}`);
        }
        response += `${variable} -> ${prods.map(prod => prod.join('')).join(' | ')}\n`;
        }

        if (!variables.includes(startSymbol)) {
        throw new Error('Invalid start symbol');
        }

        return response;
    }

    static async processInput(
        userId: string,
        question: string,
        automaton?: Automaton,
        cfg?: CFG,
        conversationId?: string
    ) {
        let validationResponse = '';
        if (automaton) {
        validationResponse = this.validateAutomaton(automaton);
        } else if (cfg) {
        validationResponse = this.validateCFG(cfg);
        }

        let conversation;
        if (conversationId) {
        conversation = await Conversation.findOne({ _id: conversationId, userId, isDeleted: false });
        if (!conversation) {
            throw new Error('Conversation not found or deleted');
        }
        } else {
        conversation = new Conversation({
            userId,
            automaton,
            cfg,
            messages: [],
            isDeleted: false,
        });
        }

        const { response: llmAnswer, graphvizCode } = await LLMService.getLLMResponse(question, conversation.messages, automaton, cfg);
        conversation.messages.push({ question, response: llmAnswer, graphvizCode, createdAt: new Date() });
        await conversation.save();

        return {
        message: validationResponse
            ? `${validationResponse}\nLLM Answer to your question "${question}":\n${llmAnswer}${graphvizCode ? `\n\nGraphviz-DOT Code:\n${graphvizCode}` : ''}`
            : `Answer to your question "${question}":\n${llmAnswer}${graphvizCode ? `\n\nGraphviz-DOT Code:\n${graphvizCode}` : ''}`,
        conversationId: conversation._id,
        };
    }

    static async getConversationHistory(userId: string) {
        return await Conversation.find({ userId, isDeleted: false }).sort({ createdAt: -1 });
    }

    static async updateConversationName(userId: string, conversationId: string, name: string) {
        const conversation = await Conversation.findOne({ _id: conversationId, userId, isDeleted: false });
        if (!conversation) {
            throw new Error('Conversation not found');
        }
        conversation.name = name;
        await conversation.save();
        return conversation;
    }

    static async deleteConversation(userId: string, conversationId: string) {
        const conversation = await Conversation.findOne({ _id: conversationId, userId, isDeleted: false });
        if (!conversation) {
        throw new Error('Conversation not found or already deleted');
        }
        conversation.isDeleted = true;
        await conversation.save();
    }

    static formatAutomatonForExport(automaton: Automaton): { content: string; filename: string } {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `${automaton.type}_automaton_${timestamp}.txt`;
        
        let content = `========================================\n`;
        content += `           ${automaton.type} AUTOMATON\n`;
        content += `========================================\n`;
        content += `Generated on: ${new Date().toLocaleString()}\n\n`;
        
        content += `TYPE: ${automaton.type}\n\n`;
        content += `STATES:\n`;
        content += `  Q = {${automaton.states.join(', ')}}\n\n`;
        
        content += `ALPHABET:\n`;
        content += `  Σ = {${automaton.alphabet.join(', ')}}\n\n`;
        
        content += `INITIAL STATE:\n`;
        content += `  q₀ = ${automaton.initialState}\n\n`;
        
        content += `ACCEPT STATES:\n`;
        content += `  F = {${automaton.acceptStates.join(', ')}}\n\n`;
        
        content += `TRANSITION FUNCTION:\n`;
        content += `  δ(state, symbol) = next_state\n`;
        content += `  --------------------------------\n`;
        for (const [state, symbol, nextState] of automaton.transitions) {
            content += `  δ(${state}, ${symbol}) = ${nextState}\n`;
        }
        
        content += `\n========================================\n`;
        content += `FORMAL DEFINITION:\n`;
        content += `M = (Q, Σ, δ, q₀, F) where:\n`;
        content += `  Q = {${automaton.states.join(', ')}}\n`;
        content += `  Σ = {${automaton.alphabet.join(', ')}}\n`;
        content += `  q₀ = ${automaton.initialState}\n`;
        content += `  F = {${automaton.acceptStates.join(', ')}}\n`;
        content += `  δ = transition function as defined above\n`;
        content += `========================================\n\n`;
        
        content += `COPY-PASTE FORMAT FOR OTHER CHATBOTS:\n`;
        content += `-------------------------------------\n`;
        content += `Type: ${automaton.type}\n`;
        content += `States: ${automaton.states.join(', ')}\n`;
        content += `Alphabet: ${automaton.alphabet.join(', ')}\n`;
        content += `Initial State: ${automaton.initialState}\n`;
        content += `Accept States: ${automaton.acceptStates.join(', ')}\n`;
        content += `Transitions:\n`;
        for (const [state, symbol, nextState] of automaton.transitions) {
            content += `  (${state}, ${symbol}) -> ${nextState}\n`;
        }
        
        return { content, filename };
    }

    static formatCFGForExport(cfg: CFG): { content: string; filename: string } {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `CFG_grammar_${timestamp}.txt`;
        
        let content = `========================================\n`;
        content += `      CONTEXT-FREE GRAMMAR (CFG)\n`;
        content += `========================================\n`;
        content += `Generated on: ${new Date().toLocaleString()}\n\n`;
        
        content += `VARIABLES (Non-terminals):\n`;
        content += `  V = {${cfg.variables.join(', ')}}\n\n`;
        
        content += `TERMINALS:\n`;
        content += `  T = {${cfg.terminals.join(', ')}}\n\n`;
        
        content += `START SYMBOL:\n`;
        content += `  S = ${cfg.startSymbol}\n\n`;
        
        content += `PRODUCTION RULES:\n`;
        content += `  P = {\n`;
        for (const [variable, productions] of Object.entries(cfg.productions)) {
            const productionList = productions.map(prod => prod.join('')).join(' | ');
            content += `    ${variable} → ${productionList}\n`;
        }
        content += `  }\n\n`;
        
        content += `========================================\n`;
        content += `FORMAL DEFINITION:\n`;
        content += `G = (V, T, P, S) where:\n`;
        content += `  V = {${cfg.variables.join(', ')}} (Variables)\n`;
        content += `  T = {${cfg.terminals.join(', ')}} (Terminals)\n`;
        content += `  S = ${cfg.startSymbol} (Start Symbol)\n`;
        content += `  P = Production Rules as defined above\n`;
        content += `========================================\n\n`;
        
        content += `COPY-PASTE FORMAT FOR OTHER CHATBOTS:\n`;
        content += `-------------------------------------\n`;
        content += `Variables: ${cfg.variables.join(', ')}\n`;
        content += `Terminals: ${cfg.terminals.join(', ')}\n`;
        content += `Start Symbol: ${cfg.startSymbol}\n`;
        content += `Productions:\n`;
        for (const [variable, productions] of Object.entries(cfg.productions)) {
            const productionList = productions.map(prod => prod.join('')).join(' | ');
            content += `  ${variable} -> ${productionList}\n`;
        }
        
        return { content, filename };
    }
}