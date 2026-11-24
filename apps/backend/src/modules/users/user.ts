import type { Role, SessionUser, UserStatus } from "@imc-calculator/shared";

export interface User {
  id: string;
  name: string;
  username: string;
  passwordHash: string;
  role: Role;
  status: UserStatus;
  createdAt: Date;
}

export type NewUser = Omit<User, "id">;

export type UserChanges = Partial<
  Pick<User, "name" | "username" | "passwordHash" | "role" | "status">
>;

export type AuthenticatedUser = SessionUser;
