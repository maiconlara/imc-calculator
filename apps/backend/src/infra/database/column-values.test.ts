import { describe, expect, it } from "vitest";
import { BMI_BANDS } from "@imc-calculator/shared";
import {
  bmiClassificationColumnValues,
  createColumnValueMap,
  roleColumnValues,
  userStatusColumnValues,
} from "./column-values";

describe("createColumnValueMap", () => {
  const colorColumnValues = createColumnValueMap<"red" | "blue">({
    red: "vermelho",
    blue: "azul",
  });

  it("translates in both directions", () => {
    expect(colorColumnValues.toColumnValue("red")).toBe("vermelho");
    expect(colorColumnValues.fromColumnValue("azul")).toBe("blue");
  });

  it("refuses values it does not know instead of storing or returning them", () => {
    expect(() => colorColumnValues.toColumnValue("green" as "red")).toThrow(
      'Unknown value "green"',
    );
    expect(() => colorColumnValues.fromColumnValue("verde")).toThrow(
      'Unknown stored value "verde"',
    );
  });

  it("lets null and undefined pass through the TypeORM transformer", () => {
    expect(colorColumnValues.columnTransformer.to(undefined)).toBeUndefined();
    expect(colorColumnValues.columnTransformer.from(null)).toBeNull();
  });
});

describe("project column values", () => {
  it("stores roles and statuses with the names of the data model", () => {
    expect(roleColumnValues.toColumnValue("admin")).toBe("admin");
    expect(roleColumnValues.toColumnValue("teacher")).toBe("professor");
    expect(roleColumnValues.toColumnValue("student")).toBe("aluno");
    expect(userStatusColumnValues.toColumnValue("active")).toBe("ativo");
    expect(userStatusColumnValues.toColumnValue("inactive")).toBe("inativo");
  });

  it("stores every BMI band with its official name from the shared band table", () => {
    BMI_BANDS.forEach((band) => {
      expect(bmiClassificationColumnValues.toColumnValue(band.classification)).toBe(
        band.label,
      );
      expect(bmiClassificationColumnValues.fromColumnValue(band.label)).toBe(
        band.classification,
      );
    });
  });
});
