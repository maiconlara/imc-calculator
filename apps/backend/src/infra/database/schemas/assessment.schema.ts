import { EntitySchema, type ValueTransformer } from "typeorm";
import type { Assessment } from "../../../modules/assessments/assessment";
import type { User } from "../../../modules/users/user";
import { bmiClassificationColumnValues } from "../column-values";

export interface AssessmentRecord extends Assessment {
  student?: User;
  assessor?: User;
}

const decimalColumnTransformer: ValueTransformer = {
  to: (codeValue: number | null | undefined) => codeValue,
  from: (columnValue: string | number | null) =>
    columnValue === null ? null : Number(columnValue),
};

export const AssessmentSchema = new EntitySchema<AssessmentRecord>({
  name: "Assessment",
  tableName: "avaliacao_imc",
  columns: {
    id: { type: "varchar", length: 36, primary: true },
    height: {
      type: "decimal",
      precision: 5,
      scale: 2,
      name: "altura",
      transformer: decimalColumnTransformer,
    },
    weight: {
      type: "decimal",
      precision: 5,
      scale: 2,
      name: "peso",
      transformer: decimalColumnTransformer,
    },
    bmi: {
      type: "decimal",
      precision: 5,
      scale: 2,
      name: "imc",
      transformer: decimalColumnTransformer,
    },
    classification: {
      type: "varchar",
      length: 30,
      name: "classificacao",
      transformer: bmiClassificationColumnValues.columnTransformer,
    },
    assessorId: { type: "varchar", length: 36, name: "id_usuario_avaliacao" },
    studentId: { type: "varchar", length: 36, name: "id_usuario_aluno" },
    createdAt: {
      type: "datetime",
      name: "dt_inclusao",
      default: () => "CURRENT_TIMESTAMP",
    },
  },
  relations: {
    assessor: {
      type: "many-to-one",
      target: "User",
      joinColumn: {
        name: "id_usuario_avaliacao",
        foreignKeyConstraintName: "FK_avaliacao_imc_avaliador",
      },
      onUpdate: "CASCADE",
      onDelete: "NO ACTION",
    },
    student: {
      type: "many-to-one",
      target: "User",
      joinColumn: {
        name: "id_usuario_aluno",
        foreignKeyConstraintName: "FK_avaliacao_imc_aluno",
      },
      onUpdate: "CASCADE",
      onDelete: "NO ACTION",
    },
  },
  indices: [
    { name: "IDX_avaliacao_imc_aluno_data", columns: ["studentId", "createdAt"] },
    { name: "IDX_avaliacao_imc_avaliador", columns: ["assessorId"] },
    { name: "IDX_avaliacao_imc_data", columns: ["createdAt"] },
  ],
});
