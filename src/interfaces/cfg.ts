export interface CFG {
    variables: string[];
    terminals: string[];
    productions: { [key: string]: string[][] };
    startSymbol: string;
}