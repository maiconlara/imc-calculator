import { HStack, IconButton } from "@chakra-ui/react";
import { Pencil, Trash2 } from "lucide-react";

interface RowActionsProps {
  editLabel: string;
  deleteLabel: string;
  onEdit?: () => void;
  onDelete?: () => void;
}

/**
 * Edit and delete buttons of a list row. A button only shows when its handler is
 * given, so the screen decides what each role may do.
 *
 * @param props - Accessible labels and the handlers of the allowed actions.
 */
export function RowActions({
  editLabel,
  deleteLabel,
  onEdit,
  onDelete,
}: RowActionsProps) {
  return (
    <HStack gap="1" justify="end">
      {onEdit ? (
        <IconButton
          size="sm"
          variant="outline"
          aria-label={editLabel}
          title="Editar"
          onClick={onEdit}
        >
          <Pencil />
        </IconButton>
      ) : null}
      {onDelete ? (
        <IconButton
          size="sm"
          variant="outline"
          colorPalette="red"
          aria-label={deleteLabel}
          title="Excluir"
          onClick={onDelete}
        >
          <Trash2 />
        </IconButton>
      ) : null}
    </HStack>
  );
}
