import { describe, expect, it } from "vitest";
import type { PublicUser, Role } from "@imc-calculator/shared";
import { getUserConfirmationCopy } from "./get-user-confirmation-copy";

function buildUser(role: Role): PublicUser {
  return {
    id: "user-1",
    name: "Maria Silva",
    username: "maria.silva",
    role,
    status: "active",
    createdAt: "2026-01-10T12:00:00.000Z",
    hasAssessments: false,
  };
}

describe("getUserConfirmationCopy", () => {
  it("asks to delete with the danger tone", () => {
    expect(
      getUserConfirmationCopy({ action: "delete", user: buildUser("teacher") }),
    ).toEqual({
      title: "Excluir cadastro?",
      description: "Maria Silva será removido do sistema. Não dá para desfazer.",
      confirmLabel: "Excluir",
      tone: "danger",
    });
  });

  it("suggests deactivating a user who cannot be deleted", () => {
    expect(
      getUserConfirmationCopy({
        action: "deactivateInsteadOfDelete",
        user: buildUser("student"),
      }),
    ).toEqual({
      title: "Inativar em vez de excluir?",
      description:
        "Maria Silva tem avaliações vinculadas e não pode ser excluído. Inativar tira o acesso na hora e mantém o histórico.",
      confirmLabel: "Inativar",
      tone: "warning",
    });
  });

  it("tells that a deactivated student stops receiving assessments", () => {
    expect(
      getUserConfirmationCopy({ action: "deactivate", user: buildUser("student") }),
    ).toEqual({
      title: "Inativar cadastro?",
      description:
        "Maria Silva perde o acesso na hora e não pode receber novas avaliações. Dá para reativar depois.",
      confirmLabel: "Inativar",
      tone: "warning",
    });
  });

  it.each<Role>(["admin", "teacher"])(
    "does not mention assessments when deactivating a %s",
    (role) => {
      expect(
        getUserConfirmationCopy({ action: "deactivate", user: buildUser(role) })
          .description,
      ).toBe("Maria Silva perde o acesso na hora. Dá para reativar depois.");
    },
  );
});
