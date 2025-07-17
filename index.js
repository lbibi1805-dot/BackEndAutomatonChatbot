const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config(); 

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

// Cấu hình API Gemini
const LLM_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
const LLM_API_KEY = process.env.LLM_API_KEY;

app.post('/api/automaton', async (req, res) => {
    const { type, states, alphabet, transitions, initialState, acceptStates, question } = req.body;

    // Kiểm tra dữ liệu automaton
    if (!type || !states || !alphabet || !transitions || !initialState || !acceptStates) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // Xác nhận automaton
    let response = `Received ${type} automaton:\n`;
    response += `States: ${states.join(', ')}\n`;
    response += `Alphabet: ${alphabet.join(', ')}\n`;
    response += `Initial State: ${initialState}\n`;
    response += `Accept States: ${acceptStates.join(', ')}\n`;
    response += `Transitions:\n`;

    for (const [state, symbol, nextState] of transitions) {
        if (!states.includes(state) || !states.includes(nextState) || !alphabet.includes(symbol)) {
        return res.status(400).json({ error: `Invalid transition: ${state}, ${symbol}, ${nextState}` });
        }
        response += `${state} --${symbol}--> ${nextState}\n`;
    }

    if (!states.includes(initialState)) {
        return res.status(400).json({ error: 'Invalid initial state' });
    }
    if (!acceptStates.every(s => states.includes(s))) {
        return res.status(400).json({ error: 'Invalid accept state(s)' });
    }

    // Xử lý câu hỏi với Gemini nếu có
    if (question) {
        if (!LLM_API_KEY) {
        response += `\nError answering question: LLM_API_KEY is not configured in .env`;
        } else {
        try {
            const prompt = `
            You are an expert in automata theory. Below is an automaton definition:
            - Type: ${type}
            - States: ${states.join(', ')}
            - Alphabet: ${alphabet.join(', ')}
            - Transitions: ${transitions.map(t => `${t[0]} --${t[1]}--> ${t[2]}`).join(', ')}
            - Initial State: ${initialState}
            - Accept States: ${acceptStates.join(', ')}
            
            The user has asked: "${question}"
            Provide a clear and accurate answer based on the automaton definition.
            `;

            const llmResponse = await axios.post(
            LLM_API_URL,
            {
                contents: [{ parts: [{ text: prompt }] }],
            },
            {
                headers: {
                'x-goog-api-key': LLM_API_KEY,
                'Content-Type': 'application/json',
                },
            }
            );

            response += `\nLLM Answer to your question "${question}":\n`;
            response += llmResponse.data.candidates[0].content.parts[0].text;
        } catch (error) {
            console.error('LLM API error:', error.response?.data || error.message);
            response += `\nError answering question: ${error.response?.data?.error?.message || 'Unable to connect to LLM API.'}`;
        }
        }
    }

    res.json({ message: response });
});

app.listen(port, () => {
    console.log(`Backend running on http://localhost:${port}`);
});