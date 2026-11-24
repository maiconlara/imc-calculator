import { describe, expect, it } from "vitest";
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  createUserSchema,
  getUtf8ByteLength,
  listUsersQuerySchema,
  nameSchema,
  updateUserSchema,
  userOptionsQuerySchema,
  usernameSchema,
} from "./user";

const firstIssueMessage = (parsedValue: {
  error?: { issues: { message: string }[] } | undefined;
}) => parsedValue.error?.issues[0]?.message;

describe("nameSchema", () => {
  it("trims the name and accepts 3 to 60 characters", () => {
    expect(nameSchema.parse("  Ana  ")).toBe("Ana");
    expect(nameSchema.safeParse("a".repeat(60)).success).toBe(true);
  });

  it.each([
    ["Al", "O nome precisa ter ao menos 3 letras"],
    ["a".repeat(61), "O nome pode ter no máximo 60 caracteres"],
  ])("rejects %s with %s", (invalidName, expectedMessage) => {
    expect(firstIssueMessage(nameSchema.safeParse(invalidName))).toBe(expectedMessage);
  });
});

describe("usernameSchema", () => {
  it("trims and lowercases the username", () => {
    expect(usernameSchema.parse("  Maria.Silva ")).toBe("maria.silva");
  });

  it.each(["ab", "maria silva", "maria@silva", "a".repeat(61)])(
    "rejects %s",
    (invalidUsername) => {
      expect(usernameSchema.safeParse(invalidUsername).success).toBe(false);
    },
  );
});

describe("getUtf8ByteLength", () => {
  it.each([
    ["abc", 3],
    ["ção", 5],
    ["€", 3],
    ["🙂", 4],
  ])("counts %s as %s bytes", (text, expectedByteLength) => {
    expect(getUtf8ByteLength(text)).toBe(expectedByteLength);
  });
});

describe("createUserSchema", () => {
  const validNewUser = {
    name: "Maria Silva",
    username: "maria.silva",
    password: "a".repeat(PASSWORD_MIN_LENGTH),
    role: "student",
  };

  const parseWithPassword = (password: string) =>
    createUserSchema.safeParse({ ...validNewUser, password });

  it("creates an active user when no status is given", () => {
    expect(createUserSchema.parse(validNewUser).status).toBe("active");
  });

  it("accepts the password length limits and rejects values outside them", () => {
    expect(parseWithPassword("a".repeat(PASSWORD_MIN_LENGTH)).success).toBe(true);
    expect(parseWithPassword("a".repeat(PASSWORD_MAX_LENGTH)).success).toBe(true);
    expect(
      firstIssueMessage(parseWithPassword("a".repeat(PASSWORD_MIN_LENGTH - 1))),
    ).toBe("A senha precisa ter ao menos 8 caracteres");
    expect(parseWithPassword("a".repeat(PASSWORD_MAX_LENGTH + 1)).success).toBe(false);
  });

  it("reports a password that is too long in characters only once", () => {
    const parsedUser = parseWithPassword("a".repeat(PASSWORD_MAX_LENGTH + 1));
    expect(parsedUser.error?.issues.map((issue) => issue.message)).toEqual([
      `A senha pode ter no máximo ${PASSWORD_MAX_LENGTH} caracteres`,
    ]);
  });

  it("rejects a password that fits in characters but exceeds the bytes bcrypt reads", () => {
    const accentedPassword = "ç".repeat(40);
    expect(accentedPassword.length).toBeLessThanOrEqual(PASSWORD_MAX_LENGTH);
    expect(firstIssueMessage(parseWithPassword(accentedPassword))).toBe(
      "A senha é longa demais. Use menos acentos ou símbolos.",
    );
  });

  it("rejects an unknown role with a Portuguese message", () => {
    const parsedUser = createUserSchema.safeParse({ ...validNewUser, role: "manager" });
    expect(firstIssueMessage(parsedUser)).toBe("Selecione um perfil");
  });
});

describe("updateUserSchema", () => {
  const userChanges = { name: "Maria Silva", username: "maria.silva", role: "teacher" };

  it.each([
    ["omitted", {}],
    ["empty", { password: "" }],
  ])("keeps the current password when the new one is %s", (_case, passwordField) => {
    expect(updateUserSchema.parse({ ...userChanges, ...passwordField }).password).toBe(
      undefined,
    );
  });

  it("validates a typed new password with the same rules as the registration", () => {
    expect(
      updateUserSchema.parse({ ...userChanges, password: "new-secret" }).password,
    ).toBe("new-secret");
    expect(
      firstIssueMessage(
        updateUserSchema.safeParse({ ...userChanges, password: "short" }),
      ),
    ).toBe("A senha precisa ter ao menos 8 caracteres");
  });
});

describe("listUsersQuerySchema", () => {
  it("treats empty filters as absent and applies the pagination defaults", () => {
    expect(listUsersQuerySchema.parse({ search: "", role: "", status: "" })).toEqual({
      page: 1,
      pageSize: 10,
    });
  });

  it("reads numbers from the query string", () => {
    expect(listUsersQuerySchema.parse({ page: "2", pageSize: "20" })).toMatchObject({
      page: 2,
      pageSize: 20,
    });
  });

  it("explains invalid filters in Portuguese", () => {
    expect(
      firstIssueMessage(listUsersQuerySchema.safeParse({ search: "a".repeat(61) })),
    ).toBe("A busca pode ter no máximo 60 caracteres");
  });
});

describe("userOptionsQuerySchema", () => {
  it("requires the role", () => {
    expect(firstIssueMessage(userOptionsQuerySchema.safeParse({}))).toBe(
      "Selecione um perfil",
    );
  });

  it.each([
    ["true", true],
    ["false", false],
    ["", undefined],
  ])("reads onlyAssessed %j as %s", (onlyAssessed, expectedValue) => {
    expect(
      userOptionsQuerySchema.parse({ role: "student", onlyAssessed }).onlyAssessed,
    ).toBe(expectedValue);
  });

  it("rejects an onlyAssessed value that is not a boolean", () => {
    expect(
      userOptionsQuerySchema.safeParse({ role: "student", onlyAssessed: "maybe" })
        .success,
    ).toBe(false);
  });
});
