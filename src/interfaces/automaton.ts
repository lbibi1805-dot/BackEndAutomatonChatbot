export interface Automaton {
    type: 'DFA' | 'NFA' | 'PDA';
    states: string[];
    alphabet: string[];
    transitions: string[][];
    initialState: string;
    acceptStates: string[];
    question?: string;
}