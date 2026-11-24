import { EntitySchema } from "typeorm";
import type { User } from "../../../modules/users/user";
import { roleColumnValues, userStatusColumnValues } from "../column-values";

export const UserSchema = new EntitySchema<User>({
  name: "User",
  tableName: "usuario",
  columns: {
    id: { type: "varchar", length: 36, primary: true },
    name: { type: "varchar", length: 60, name: "nome" },
    username: { type: "varchar", length: 60, unique: true, name: "usuario" },
    passwordHash: { type: "varchar", length: 255, name: "senha" },
    role: {
      type: "varchar",
      length: 20,
      name: "perfil",
      transformer: roleColumnValues.columnTransformer,
    },
    status: {
      type: "varchar",
      length: 10,
      name: "situacao",
      transformer: userStatusColumnValues.columnTransformer,
    },
    createdAt: {
      type: "datetime",
      name: "dt_inclusao",
      default: () => "CURRENT_TIMESTAMP",
    },
  },
  checks: [
    {
      name: "CHK_usuario_perfil",
      expression: "perfil IN ('admin', 'aluno', 'professor')",
    },
    { name: "CHK_usuario_situacao", expression: "situacao IN ('ativo', 'inativo')" },
  ],
});
