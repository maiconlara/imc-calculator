"use client";

import type { PublicUser } from "@imc-calculator/shared";
import { FormDialog } from "@/components/ui/form-dialog";
import { useSessionUser } from "@/hooks";
import { getManagedUserNoun } from "@/lib/screen-titles";
import { UserForm } from "./user-form";

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userToEdit: PublicUser | null;
}

/**
 * Creates a user, or edits `userToEdit` when given, with the same form.
 */
export function UserFormDialog({ open, onOpenChange, userToEdit }: UserFormDialogProps) {
  const sessionUser = useSessionUser();
  const managedUserNoun = getManagedUserNoun(sessionUser.role).singular;

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={userToEdit ? `Editar ${managedUserNoun}` : `Novo ${managedUserNoun}`}
      description={
        userToEdit
          ? "Deixe a senha em branco para manter a atual."
          : "A pessoa entra no sistema com o usuário e a senha definidos aqui."
      }
    >
      <UserForm userToEdit={userToEdit} onSaved={() => onOpenChange(false)} />
    </FormDialog>
  );
}
