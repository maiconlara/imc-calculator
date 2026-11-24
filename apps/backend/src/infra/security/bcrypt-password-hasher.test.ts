import bcrypt from "bcryptjs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BcryptPasswordHasher } from "./bcrypt-password-hasher";

const passwordHasher = new BcryptPasswordHasher(4);

afterEach(() => {
  vi.restoreAllMocks();
});

describe("BcryptPasswordHasher", () => {
  it("stores a bcrypt hash, never the password itself", async () => {
    const passwordHash = await passwordHasher.hash("senha-forte-123");

    expect(passwordHash).toMatch(/^\$2[aby]\$04\$/);
    expect(passwordHash).not.toContain("senha-forte-123");
  });

  it("matches only the right password", async () => {
    const passwordHash = await passwordHasher.hash("senha-forte-123");

    await expect(passwordHasher.compare("senha-forte-123", passwordHash)).resolves.toBe(
      true,
    );
    await expect(passwordHasher.compare("senha-errada", passwordHash)).resolves.toBe(
      false,
    );
  });

  it("still runs a bcrypt comparison when there is no stored hash, and answers false", async () => {
    const bcryptCompare = vi.spyOn(bcrypt, "compare");

    await expect(passwordHasher.compare("senha-forte-123", null)).resolves.toBe(false);

    expect(bcryptCompare).toHaveBeenCalledOnce();
    expect(bcryptCompare).toHaveBeenCalledWith(
      "senha-forte-123",
      expect.stringMatching(/^\$2[aby]\$04\$/),
    );
  });
});
