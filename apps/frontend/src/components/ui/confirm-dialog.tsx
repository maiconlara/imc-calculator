"use client";

import type { ReactNode } from "react";
import { Button, Center, Dialog, Portal, Text } from "@chakra-ui/react";
import { AlertTriangle, ShieldAlert } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  tone?: "danger" | "warning";
  isPending?: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirmar",
  tone = "danger",
  isPending = false,
}: ConfirmDialogProps) {
  const isDanger = tone === "danger";
  const ToneIcon = isDanger ? ShieldAlert : AlertTriangle;

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(event) => onOpenChange(event.open)}
      role="alertdialog"
      placement="center"
      size="sm"
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content borderRadius="l3">
            <Dialog.Header flexDirection="column" alignItems="start" gap="3">
              <Center
                boxSize="10"
                borderRadius="full"
                bg={isDanger ? "red.subtle" : "orange.subtle"}
                color={isDanger ? "red.fg" : "orange.fg"}
              >
                <ToneIcon size={20} aria-hidden="true" />
              </Center>
              <Dialog.Title>{title}</Dialog.Title>
            </Dialog.Header>
            {description ? (
              <Dialog.Body>
                <Text fontSize="sm" color="fg.muted">
                  {description}
                </Text>
              </Dialog.Body>
            ) : null}
            <Dialog.Footer>
              <Button
                variant="outline"
                disabled={isPending}
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                colorPalette={isDanger ? "red" : "graphite"}
                loading={isPending}
                loadingText="Aguarde"
                onClick={onConfirm}
              >
                {confirmLabel}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
