import axios from 'axios';
import { Automaton } from '../interfaces/automaton';
import { CFG } from '../interfaces/cfg';
import { Message } from '../interfaces/conversation';

export class LLMService {
    static async retryRequest(url: string, data: any, headers: any, retries = 3, delay = 5000): Promise<any> {
        for (let i = 0; i < retries; i++) {
        try {
            const response = await axios.post(url, data, { headers });
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 503 && i < retries - 1) {
            console.log(`Retry ${i + 1}/${retries} after ${delay}ms due to 503 error`);
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2;
            } else {
            throw error;
            }
        }
        }
        throw new Error('Max retries reached for Gemini API');
    }

    static async getLLMResponse(
        question: string,
        history: Message[],
        automaton?: Automaton,
        cfg?: CFG
    ): Promise<{ response: string; graphvizCode?: string }> {
        const LLM_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
        const LLM_API_KEY = process.env.LLM_API_KEY;

        if (!LLM_API_KEY) {
        throw new Error('LLM_API_KEY is not configured in .env');
        }

        const historyPrompt = history
        .map((msg) => `User: ${msg.question}\nAssistant: ${msg.response}`)
        .join('\n\n');

        let context = '';
        if (automaton) {
        context = `
            Automaton definition:
            - Type: ${automaton.type}
            - States: ${automaton.states.join(', ')}
            - Alphabet: ${automaton.alphabet.join(', ')}
            - Transitions: ${automaton.transitions.map(t => `${t[0]} --${t[1]}--> ${t[2]}`).join(', ')}
            - Initial State: ${automaton.initialState}
            - Accept States: ${automaton.acceptStates.join(', ')}
        `;
        } else if (cfg) {
        context = `
            CFG definition:
            - Variables: ${cfg.variables.join(', ')}
            - Terminals: ${cfg.terminals.join(', ')}
            - Productions: ${Object.entries(cfg.productions)
            .map(([key, value]) => `${key} -> ${value.map(prod => prod.join('')).join(' | ')}`)
            .join(', ')}
            - Start Symbol: ${cfg.startSymbol}
        `;
        }

        const isGenerateAutomatonRequest = question.toLowerCase().includes('generate') && 
        (question.toLowerCase().includes('automaton') || question.toLowerCase().includes('dfa') || 
        question.toLowerCase().includes('nfa') || question.toLowerCase().includes('pda'));

        const prompt = `
        You are an expert in automata theory and formal languages. Below is the context (if provided):
        ${context}
        
        Conversation history:
        ${historyPrompt}
        
        The user has asked: "${question}"
        Provide a clear and accurate answer based on the context and conversation history. If no context is provided, answer the question to the best of your knowledge.
        ${isGenerateAutomatonRequest ? `
        If the question asks to generate an automaton (DFA, NFA, or PDA), also provide the Graphviz-DOT code to visualize it. 
        Format the response as follows:
        - Main answer: The description of the automaton and any explanation.
        - Graphviz-DOT code: Wrapped in \`\`\`dot\n...\n\`\`\`.
        For example:
        \`\`\`dot
        digraph G {
            rankdir=LR;
            start [shape=point];
            q0 [shape=circle];
            q1 [shape=doublecircle];
            start -> q0;
            q0 -> q1 [label="a"];
            q1 -> q0 [label="b"];
        }
        \`\`\`
        ` : ''}
        `;

        try {
        const response = await this.retryRequest(
            LLM_API_URL,
            { contents: [{ parts: [{ text: prompt }] }] },
            {
            'x-goog-api-key': LLM_API_KEY,
            'Content-Type': 'application/json',
            }
        );

        const fullResponse = response.candidates[0].content.parts[0].text;
        let graphvizCode: string | undefined;

        // Tách code Graphviz nếu có
        const graphvizMatch = fullResponse.match(/```dot\n([\s\S]*?)\n```/);
        if (graphvizMatch) {
            graphvizCode = graphvizMatch[1].trim();
            // Loại bỏ code Graphviz khỏi response chính
            const cleanedResponse = fullResponse.replace(/```dot\n[\s\S]*?\n```/, '').trim();
            return { response: cleanedResponse, graphvizCode };
        }

        return { response: fullResponse };
        } catch (error: any) {
        throw new Error(error.response?.data?.error?.message || 'Unable to connect to LLM API');
        }
    }
}