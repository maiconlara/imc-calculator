"use client";

import type { ReactNode } from "react";
import { CloseButton, Dialog, Portal } from "@chakra-ui/react";

interface FormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
}

/**
 * Dialog shell shared by every create and edit form. Its content mounts on each open
 * and unmounts on close, so the form inside always starts from its default values.
 */
export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
}: FormDialogProps) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(event) => onOpenChange(event.open)}
      placement="center"
      size="md"
      lazyMount
      unmountOnExit
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content borderRadius="l3" mx="4">
            <Dialog.Header flexDirection="column" alignItems="start" gap="1" pe="12">
              <Dialog.Title
                textTransform="uppercase"
                fontWeight="900"
                letterSpacing="tight"
              >
                {title}
              </Dialog.Title>
              {description ? (
                <Dialog.Description fontSize="sm" color="fg.muted">
                  {description}
                </Dialog.Description>
              ) : null}
            </Dialog.Header>
            {children}
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" aria-label="Fechar" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
