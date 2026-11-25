"use client";

import type { FormEventHandler, ReactNode } from "react";
import { Button, Dialog, Stack } from "@chakra-ui/react";

interface FormDialogFormProps {
  onSubmit: FormEventHandler<HTMLFormElement>;
  submitLabel: string;
  isSubmitting: boolean;
  children: ReactNode;
}

/**
 * Fields and footer of a `FormDialog`. It is rendered by the component that owns the
 * form state, so that state lives only while the dialog is open.
 */
export function FormDialogForm({
  onSubmit,
  submitLabel,
  isSubmitting,
  children,
}: FormDialogFormProps) {
  return (
    <form noValidate onSubmit={onSubmit}>
      <Dialog.Body>
        <Stack gap="4">{children}</Stack>
      </Dialog.Body>
      <Dialog.Footer>
        <Dialog.ActionTrigger asChild>
          <Button variant="outline" disabled={isSubmitting}>
            Cancelar
          </Button>
        </Dialog.ActionTrigger>
        <Button
          type="submit"
          colorPalette="brand"
          loading={isSubmitting}
          loadingText="Salvando"
        >
          {submitLabel}
        </Button>
      </Dialog.Footer>
    </form>
  );
}
