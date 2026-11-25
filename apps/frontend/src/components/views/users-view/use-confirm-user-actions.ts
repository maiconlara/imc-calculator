"use client";

import type { PublicUser, UserStatus } from "@imc-calculator/shared";
import { notify } from "@/components/ui/toaster";
import { useChangeUserStatus, useDeleteUser, useDialogTarget } from "@/hooks";
import { getErrorMessage, getErrorStatus } from "@/lib/api-errors";
import type { UserConfirmation } from "./users-view.types";

interface ConfirmUserActionsOptions {
  prepareUserRemoval: () => () => void;
}

/**
 * Status changes and deletions of the users list. Deactivating and deleting wait for
 * the confirmation dialog, and a user with linked assessments, known beforehand or
 * answered by the API with 409, gets the suggestion to deactivate instead.
 *
 * @param options.prepareUserRemoval - Runs right before a deletion; the function it
 * returns runs once the deletion succeeds.
 * @returns The state of the confirmation dialog and the actions offered on each row.
 */
export function useConfirmUserActions({ prepareUserRemoval }: ConfirmUserActionsOptions) {
  const changeUserStatus = useChangeUserStatus();
  const deleteUser = useDeleteUser();
  const confirmDialog = useDialogTarget<UserConfirmation>();

  function changeStatusOf(user: PublicUser, newStatus: UserStatus) {
    changeUserStatus.mutate(
      { userId: user.id, status: newStatus },
      {
        onSuccess: () => {
          notify.success(
            newStatus === "active"
              ? `${user.name} foi reativado e já pode entrar.`
              : `${user.name} foi inativado e perdeu o acesso.`,
          );
          confirmDialog.close();
        },
        onError: (error) =>
          notify.error(getErrorMessage(error, "Não foi possível mudar a situação.")),
      },
    );
  }

  function offerDeactivationInsteadOfDelete(user: PublicUser) {
    if (user.status === "active") {
      confirmDialog.open({ action: "deactivateInsteadOfDelete", user });
      return;
    }
    confirmDialog.close();
    notify.error(
      `${user.name} tem avaliações vinculadas e não pode ser excluído. O cadastro já está inativo e sem acesso.`,
    );
  }

  function deleteConfirmedUser(user: PublicUser) {
    const finishUserRemoval = prepareUserRemoval();
    deleteUser.mutate(user.id, {
      onSuccess: () => {
        notify.success(`${user.name} foi excluído.`);
        confirmDialog.close();
        finishUserRemoval();
      },
      onError: (error) => {
        if (getErrorStatus(error) === 409) {
          offerDeactivationInsteadOfDelete(user);
          return;
        }
        notify.error(getErrorMessage(error, "Não foi possível excluir o usuário."));
      },
    });
  }

  function confirmPendingAction() {
    const confirmation = confirmDialog.target;
    if (!confirmation) return;
    if (confirmation.action === "delete") {
      deleteConfirmedUser(confirmation.user);
      return;
    }
    changeStatusOf(confirmation.user, "inactive");
  }

  return {
    confirmation: confirmDialog.target,
    isConfirmDialogOpen: confirmDialog.isOpen,
    onConfirmDialogOpenChange: confirmDialog.onOpenChange,
    confirmPendingAction,
    isUserChangePending: changeUserStatus.isPending || deleteUser.isPending,
    statusChangingUserId: changeUserStatus.isPending
      ? changeUserStatus.variables?.userId
      : undefined,
    activateUser: (user: PublicUser) => changeStatusOf(user, "active"),
    askToDeactivateUser: (user: PublicUser) =>
      confirmDialog.open({ action: "deactivate", user }),
    askToDeleteUser: (user: PublicUser) =>
      user.hasAssessments
        ? offerDeactivationInsteadOfDelete(user)
        : confirmDialog.open({ action: "delete", user }),
  };
}
