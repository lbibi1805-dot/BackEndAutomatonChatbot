import { Request, Response } from 'express';
import { AuthService } from '../services/authService';

export class AuthController {
    static async register(req: Request, res: Response) {
        try {
        const { username, password } = req.body;
        const result = await AuthService.register(username, password);
        res.json(result);
        } catch (error: any) {
        res.status(400).json({ error: error.message });
        }
    }

    static async login(req: Request, res: Response) {
        try {
        const { username, password } = req.body;
        const result = await AuthService.login(username, password);
        res.json(result);
        } catch (error: any) {
        res.status(400).json({ error: error.message });
        }
    }

    static async logout(req: Request, res: Response) {
        try {
            // Since we're using stateless JWT tokens, logout is mainly client-side
            // But we can add token blacklisting logic here if needed in the future
            res.json({ message: 'Logged out successfully' });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }
}