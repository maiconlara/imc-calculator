import { z } from "zod";
import { optionalParam, paginationSchema } from "./common";

export const ROLES = ["admin", "teacher", "student"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Administrador",
  teacher: "Professor",
  student: "Aluno",
};

export const USER_STATUSES = ["active", "inactive"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  active: "Ativo",
  inactive: "Inativo",
};

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 72;
export const USER_SEARCH_MAX_LENGTH = 60;

/**
 * Counts the bytes a text takes in UTF-8, the unit bcrypt limits passwords by.
 *
 * @param text - Text to measure.
 * @returns The UTF-8 byte length.
 */
export function getUtf8ByteLength(text: string): number {
  let byteLength = 0;
  for (const character of text) {
    const codePoint = character.codePointAt(0) ?? 0;
    if (codePoint < 0x80) byteLength += 1;
    else if (codePoint < 0x800) byteLength += 2;
    else if (codePoint < 0x10000) byteLength += 3;
    else byteLength += 4;
  }
  return byteLength;
}

export const nameSchema = z
  .string({ error: "Informe o nome" })
  .trim()
  .min(3, "O nome precisa ter ao menos 3 letras")
  .max(60, "O nome pode ter no máximo 60 caracteres");

export const usernameSchema = z
  .string({ error: "Informe o usuário" })
  .trim()
  .toLowerCase()
  .min(3, "O usuário precisa ter ao menos 3 caracteres")
  .max(60, "O usuário pode ter no máximo 60 caracteres")
  .regex(
    /^[a-z0-9._-]+$/,
    "Use só letras minúsculas, números, ponto, hífen ou sublinhado",
  );

export const passwordSchema = z
  .string({ error: "Informe a senha" })
  .min(
    PASSWORD_MIN_LENGTH,
    `A senha precisa ter ao menos ${PASSWORD_MIN_LENGTH} caracteres`,
  )
  .max(PASSWORD_MAX_LENGTH, {
    message: `A senha pode ter no máximo ${PASSWORD_MAX_LENGTH} caracteres`,
    abort: true,
  })
  .refine(
    (password) => getUtf8ByteLength(password) <= PASSWORD_MAX_LENGTH,
    "A senha é longa demais. Use menos acentos ou símbolos.",
  );

/**
 * New password on the edit form: an empty value keeps the current password.
 */
export const optionalNewPasswordSchema = z
  .string({ error: "Informe a senha" })
  .transform((typedPassword) => (typedPassword === "" ? undefined : typedPassword))
  .pipe(passwordSchema.optional())
  .optional();

export const roleSchema = z.enum(ROLES, { error: "Selecione um perfil" });
export const userStatusSchema = z.enum(USER_STATUSES, { error: "Selecione a situação" });

export const createUserSchema = z.object({
  name: nameSchema,
  username: usernameSchema,
  password: passwordSchema,
  role: roleSchema,
  status: userStatusSchema.default("active"),
});

export type CreateUserInput = z.input<typeof createUserSchema>;
export type CreateUserData = z.output<typeof createUserSchema>;

export const updateUserSchema = z.object({
  name: nameSchema,
  username: usernameSchema,
  role: roleSchema,
  password: optionalNewPasswordSchema,
});

export type UpdateUserInput = z.input<typeof updateUserSchema>;
export type UpdateUserData = z.output<typeof updateUserSchema>;

export const changeUserStatusSchema = z.object({
  status: userStatusSchema,
});

export type ChangeUserStatusData = z.output<typeof changeUserStatusSchema>;

export const listUsersQuerySchema = paginationSchema.extend({
  search: optionalParam(
    z
      .string({ error: "Busca inválida" })
      .trim()
      .max(
        USER_SEARCH_MAX_LENGTH,
        `A busca pode ter no máximo ${USER_SEARCH_MAX_LENGTH} caracteres`,
      ),
  ),
  role: optionalParam(roleSchema),
  status: optionalParam(userStatusSchema),
});

export type ListUsersQuery = z.output<typeof listUsersQuerySchema>;
export type ListUsersFilters = Partial<ListUsersQuery>;

export const userOptionsQuerySchema = z.object({
  role: roleSchema,
  status: optionalParam(userStatusSchema),
  onlyAssessed: optionalParam(
    z.stringbool({ error: "Use true ou false em onlyAssessed" }),
  ),
});

export type UserOptionsQuery = z.output<typeof userOptionsQuerySchema>;

export interface UserOptionsFilters {
  role: Role;
  status?: UserStatus;
  onlyAssessed?: boolean;
}

export interface PublicUser {
  id: string;
  name: string;
  username: string;
  role: Role;
  status: UserStatus;
  createdAt: string;
  hasAssessments: boolean;
}

export interface UserOption {
  id: string;
  name: string;
  status: UserStatus;
}
