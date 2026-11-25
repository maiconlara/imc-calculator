import type { UserConfirmation } from "./users-view.types";

interface UserConfirmationCopy {
  title: string;
  description: string;
  confirmLabel: string;
  tone: "danger" | "warning";
}

/**
 * Writes the title, text and button of the confirmation dialog of each user action.
 * Only students receive assessments, so only their deactivation mentions it.
 *
 * @param confirmation - Action waiting for confirmation and the user it affects.
 * @returns The texts and the tone of the dialog.
 */
export function getUserConfirmationCopy({
  action,
  user,
}: UserConfirmation): UserConfirmationCopy {
  if (action === "delete") {
    return {
      title: "Excluir cadastro?",
      description: `${user.name} será removido do sistema. Não dá para desfazer.`,
      confirmLabel: "Excluir",
      tone: "danger",
    };
  }
  if (action === "deactivateInsteadOfDelete") {
    return {
      title: "Inativar em vez de excluir?",
      description: `${user.name} tem avaliações vinculadas e não pode ser excluído. Inativar tira o acesso na hora e mantém o histórico.`,
      confirmLabel: "Inativar",
      tone: "warning",
    };
  }
  const isStudent = user.role === "student";
  return {
    title: "Inativar cadastro?",
    description: isStudent
      ? `${user.name} perde o acesso na hora e não pode receber novas avaliações. Dá para reativar depois.`
      : `${user.name} perde o acesso na hora. Dá para reativar depois.`,
    confirmLabel: "Inativar",
    tone: "warning",
  };
}
