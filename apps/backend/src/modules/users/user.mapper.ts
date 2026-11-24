import type { PublicUser, SessionUser } from "@imc-calculator/shared";
import type { User } from "./user";

export function toPublicUser(user: User, hasAssessments: boolean): PublicUser {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt.toISOString(),
    hasAssessments,
  };
}

export function toSessionUser(user: User): SessionUser {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    role: user.role,
  };
}
