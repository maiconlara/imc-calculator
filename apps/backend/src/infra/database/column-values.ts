import type { ValueTransformer } from "typeorm";
import {
  BMI_CLASSIFICATION_LABELS,
  type BmiClassification,
  type Role,
  type UserStatus,
} from "@imc-calculator/shared";

export interface ColumnValueMap<T extends string> {
  toColumnValue(codeValue: T): string;
  fromColumnValue(columnValue: string): T;
  columnTransformer: ValueTransformer;
}

/**
 * Translates the English values used by the code into the values the database
 * stores, as defined by the requirements document.
 *
 * @param columnValueByCodeValue - Stored column value for every code value.
 * @returns Conversions in both directions and a TypeORM column transformer.
 */
export function createColumnValueMap<T extends string>(
  columnValueByCodeValue: Record<T, string>,
): ColumnValueMap<T> {
  const codeValueByColumnValue = new Map(
    Object.entries<string>(columnValueByCodeValue).map(([codeValue, columnValue]) => [
      columnValue,
      codeValue as T,
    ]),
  );

  const toColumnValue = (codeValue: T): string => {
    if (!Object.hasOwn(columnValueByCodeValue, codeValue)) {
      throw new Error(`Unknown value "${codeValue}"`);
    }
    return columnValueByCodeValue[codeValue];
  };

  const fromColumnValue = (columnValue: string): T => {
    const codeValue = codeValueByColumnValue.get(columnValue);
    if (codeValue === undefined) {
      throw new Error(`Unknown stored value "${columnValue}"`);
    }
    return codeValue;
  };

  return {
    toColumnValue,
    fromColumnValue,
    columnTransformer: {
      to: (codeValue: unknown) =>
        typeof codeValue === "string" ? toColumnValue(codeValue as T) : codeValue,
      from: (columnValue: unknown) =>
        typeof columnValue === "string" ? fromColumnValue(columnValue) : columnValue,
    },
  };
}

export const roleColumnValues = createColumnValueMap<Role>({
  admin: "admin",
  teacher: "professor",
  student: "aluno",
});

export const userStatusColumnValues = createColumnValueMap<UserStatus>({
  active: "ativo",
  inactive: "inativo",
});

export const bmiClassificationColumnValues = createColumnValueMap<BmiClassification>(
  BMI_CLASSIFICATION_LABELS,
);
