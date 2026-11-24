import type { Role, UserStatus } from "@imc-calculator/shared";

export interface User {
  id: string;
  name: string;
  username: string;
  passwordHash: string;
  role: Role;
  status: UserStatus;
  createdAt: Date;
}
