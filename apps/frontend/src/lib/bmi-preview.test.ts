import { describe, expect, it } from "vitest";
import { buildBmiPreview } from "./bmi-preview";

describe("buildBmiPreview", () => {
  it("calculates and classifies the BMI once both measures are valid", () => {
    expect(buildBmiPreview("1,75", "80")).toEqual({
      kind: "result",
      bmi: 26.12,
      classification: "overweight",
    });
  });

  it("asks for the missing measure", () => {
    expect(buildBmiPreview("1,75", "")).toEqual({
      kind: "hint",
      message: "Preencha altura e peso para ver o resultado.",
      isOutOfRange: false,
    });
  });

  it("explains a measure out of range with the message of the shared rule", () => {
    expect(buildBmiPreview("2,6", "")).toEqual({
      kind: "hint",
      message: "A altura máxima é 2,50 m",
      isOutOfRange: true,
    });
    expect(buildBmiPreview("1,75", "5")).toEqual({
      kind: "hint",
      message: "O peso mínimo é 10 kg",
      isOutOfRange: true,
    });
  });
});
