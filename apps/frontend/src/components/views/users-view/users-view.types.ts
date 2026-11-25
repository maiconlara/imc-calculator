import type { PublicUser } from "@imc-calculator/shared";

export interface UserConfirmation {
  action: "deactivate" | "delete" | "deactivateInsteadOfDelete";
  user: PublicUser;
}

export interface UserRowContext {
  sessionUserId: string;
  canChooseRole: boolean;
  canManageUsers: boolean;
  canDeleteUsers: boolean;
  statusChangingUserId: string | undefined;
  onEdit: (user: PublicUser) => void;
  onActivate: (user: PublicUser) => void;
  onDeactivate: (user: PublicUser) => void;
  onDelete: (user: PublicUser) => void;
}

export interface UserRowProps {
  user: PublicUser;
  rowContext: UserRowContext;
}
