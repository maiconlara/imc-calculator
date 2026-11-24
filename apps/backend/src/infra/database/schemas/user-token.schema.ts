import { EntitySchema } from "typeorm";
import type { User } from "../../../modules/users/user";

export interface UserTokenRecord {
  id: string;
  refreshTokenHash: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
  user?: User;
}

export const UserTokenSchema = new EntitySchema<UserTokenRecord>({
  name: "UserToken",
  tableName: "usuario_token",
  columns: {
    id: { type: "varchar", length: 36, primary: true },
    refreshTokenHash: {
      type: "varchar",
      length: 255,
      unique: true,
      name: "refresh_token",
    },
    userId: { type: "varchar", length: 36, name: "id_usuario" },
    expiresAt: { type: "datetime", name: "expiracao_token" },
    createdAt: {
      type: "datetime",
      name: "dt_inclusao",
      default: () => "CURRENT_TIMESTAMP",
    },
  },
  relations: {
    user: {
      type: "many-to-one",
      target: "User",
      joinColumn: {
        name: "id_usuario",
        foreignKeyConstraintName: "FK_usuario_token_usuario",
      },
      onUpdate: "CASCADE",
      onDelete: "NO ACTION",
    },
  },
  indices: [{ name: "IDX_usuario_token_usuario", columns: ["userId"] }],
});
