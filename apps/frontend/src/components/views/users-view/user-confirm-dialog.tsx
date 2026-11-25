import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { getUserConfirmationCopy } from "./get-user-confirmation-copy";
import type { UserConfirmation } from "./users-view.types";

interface UserConfirmDialogProps {
  confirmation: UserConfirmation;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
}

export function UserConfirmDialog({
  confirmation,
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: UserConfirmDialogProps) {
  const confirmationCopy = getUserConfirmationCopy(confirmation);
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      onConfirm={onConfirm}
      title={confirmationCopy.title}
      description={confirmationCopy.description}
      confirmLabel={confirmationCopy.confirmLabel}
      tone={confirmationCopy.tone}
      isPending={isPending}
    />
  );
}
