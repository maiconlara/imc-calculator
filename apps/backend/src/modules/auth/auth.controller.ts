import type { RequestHandler } from "express";
import { loginSchema, refreshTokenSchema } from "@imc-calculator/shared";
import { getAuthenticatedUser } from "../../shared/http/authentication";
import type { AuthService } from "./auth.service";

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  login: RequestHandler = async (req, res) => {
    const credentials = loginSchema.parse(req.body);
    res.json(await this.authService.login(credentials));
  };

  refreshSession: RequestHandler = async (req, res) => {
    const { refreshToken } = refreshTokenSchema.parse(req.body);
    res.json(await this.authService.refreshSession(refreshToken));
  };

  logout: RequestHandler = async (req, res) => {
    const { refreshToken } = refreshTokenSchema.parse(req.body);
    await this.authService.logout(refreshToken);
    res.status(204).end();
  };

  getSessionUser: RequestHandler = (req, res) => {
    res.json(getAuthenticatedUser(req));
  };
}
