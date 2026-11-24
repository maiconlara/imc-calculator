import { Table, type MigrationInterface, type QueryRunner } from "typeorm";

export class CreateInitialTables1795046400000 implements MigrationInterface {
  name = "CreateInitialTables1795046400000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "usuario",
        columns: [
          { name: "id", type: "varchar", length: "36", isPrimary: true },
          { name: "nome", type: "varchar", length: "60" },
          { name: "usuario", type: "varchar", length: "60", isUnique: true },
          { name: "senha", type: "varchar", length: "255" },
          { name: "perfil", type: "varchar", length: "20" },
          { name: "situacao", type: "varchar", length: "10" },
          { name: "dt_inclusao", type: "datetime", default: "CURRENT_TIMESTAMP" },
        ],
        checks: [
          {
            name: "CHK_usuario_perfil",
            expression: "perfil IN ('admin', 'aluno', 'professor')",
          },
          {
            name: "CHK_usuario_situacao",
            expression: "situacao IN ('ativo', 'inativo')",
          },
        ],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: "usuario_token",
        columns: [
          { name: "id", type: "varchar", length: "36", isPrimary: true },
          { name: "refresh_token", type: "varchar", length: "255", isUnique: true },
          { name: "id_usuario", type: "varchar", length: "36" },
          { name: "expiracao_token", type: "datetime" },
          { name: "dt_inclusao", type: "datetime", default: "CURRENT_TIMESTAMP" },
        ],
        foreignKeys: [
          {
            name: "FK_usuario_token_usuario",
            columnNames: ["id_usuario"],
            referencedTableName: "usuario",
            referencedColumnNames: ["id"],
            onUpdate: "CASCADE",
            onDelete: "NO ACTION",
          },
        ],
        indices: [{ name: "IDX_usuario_token_usuario", columnNames: ["id_usuario"] }],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: "avaliacao_imc",
        columns: [
          { name: "id", type: "varchar", length: "36", isPrimary: true },
          { name: "altura", type: "decimal", precision: 5, scale: 2 },
          { name: "peso", type: "decimal", precision: 5, scale: 2 },
          { name: "imc", type: "decimal", precision: 5, scale: 2 },
          { name: "classificacao", type: "varchar", length: "30" },
          { name: "id_usuario_avaliacao", type: "varchar", length: "36" },
          { name: "id_usuario_aluno", type: "varchar", length: "36" },
          { name: "dt_inclusao", type: "datetime", default: "CURRENT_TIMESTAMP" },
        ],
        foreignKeys: [
          {
            name: "FK_avaliacao_imc_avaliador",
            columnNames: ["id_usuario_avaliacao"],
            referencedTableName: "usuario",
            referencedColumnNames: ["id"],
            onUpdate: "CASCADE",
            onDelete: "NO ACTION",
          },
          {
            name: "FK_avaliacao_imc_aluno",
            columnNames: ["id_usuario_aluno"],
            referencedTableName: "usuario",
            referencedColumnNames: ["id"],
            onUpdate: "CASCADE",
            onDelete: "NO ACTION",
          },
        ],
        indices: [
          {
            name: "IDX_avaliacao_imc_aluno_data",
            columnNames: ["id_usuario_aluno", "dt_inclusao"],
          },
          { name: "IDX_avaliacao_imc_avaliador", columnNames: ["id_usuario_avaliacao"] },
          { name: "IDX_avaliacao_imc_data", columnNames: ["dt_inclusao"] },
        ],
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("avaliacao_imc");
    await queryRunner.dropTable("usuario_token");
    await queryRunner.dropTable("usuario");
  }
}
