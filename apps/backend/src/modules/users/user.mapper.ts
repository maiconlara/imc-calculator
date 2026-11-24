import type { SessionUser } from "@imc-calculator/shared";
import type { User } from "./user";

export function toSessionUser(user: User): SessionUser {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    role: user.role,
  };
}
