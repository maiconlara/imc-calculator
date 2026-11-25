"use client";

import { useState } from "react";
import { Button } from "@chakra-ui/react";
import { Plus } from "lucide-react";
import { AssessmentFormDialog } from "./assessment-form-dialog";

export function NewAssessmentButton() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <Button colorPalette="brand" size="sm" onClick={() => setIsDialogOpen(true)}>
        <Plus /> Nova avaliação
      </Button>
      <AssessmentFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        assessmentToEdit={null}
      />
    </>
  );
}
