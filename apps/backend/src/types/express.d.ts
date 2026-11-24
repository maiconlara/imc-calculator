import type { AuthenticatedUser } from "../modules/users/user";

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
