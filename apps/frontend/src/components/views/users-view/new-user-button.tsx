"use client";

import { useState } from "react";
import { Button } from "@chakra-ui/react";
import { UserPlus } from "lucide-react";
import { useSessionUser } from "@/hooks";
import { getManagedUserNoun } from "@/lib/screen-titles";
import { UserFormDialog } from "./user-form-dialog";

export function NewUserButton() {
  const sessionUser = useSessionUser();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <Button colorPalette="brand" size="sm" onClick={() => setIsDialogOpen(true)}>
        <UserPlus /> Novo {getManagedUserNoun(sessionUser.role).singular}
      </Button>
      <UserFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        userToEdit={null}
      />
    </>
  );
}
