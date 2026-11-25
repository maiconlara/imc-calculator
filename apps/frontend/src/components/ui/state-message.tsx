"use client";

import type { ComponentType, ReactNode } from "react";
import { Button, EmptyState, VStack } from "@chakra-ui/react";
import { RotateCw, ServerCrash, type LucideProps } from "lucide-react";
import { getErrorMessage } from "@/lib/api-errors";

export interface StateMessageContent {
  icon: ComponentType<LucideProps>;
  title: string;
  description?: string;
  action?: ReactNode;
}

/**
 * Message shown in place of data: nothing registered yet, nothing matching the
 * filters, or a failed load.
 *
 * @param isFramed - Draws the panel background and border, for a block that stands
 *                   alone on the page instead of inside a card.
 */
export function StateMessage({
  icon: StateIcon,
  title,
  description,
  action,
  isFramed = false,
}: StateMessageContent & { isFramed?: boolean }) {
  return (
    <EmptyState.Root
      py={isFramed ? "12" : "8"}
      bg={isFramed ? "bg.panel" : undefined}
      borderWidth={isFramed ? "1px" : undefined}
      borderRadius="l3"
    >
      <EmptyState.Content>
        <EmptyState.Indicator>
          <StateIcon />
        </EmptyState.Indicator>
        <VStack textAlign="center" gap="1">
          <EmptyState.Title>{title}</EmptyState.Title>
          {description ? (
            <EmptyState.Description>{description}</EmptyState.Description>
          ) : null}
        </VStack>
        {action}
      </EmptyState.Content>
    </EmptyState.Root>
  );
}

/**
 * Failed load of a list or block, with the reason and a button that fetches it again.
 * It replaces the data, so a failure never looks like an empty list.
 */
export function LoadErrorMessage({
  title,
  loadError,
  onRetry,
  isFramed = false,
}: {
  title: string;
  loadError: Error;
  onRetry: () => void;
  isFramed?: boolean;
}) {
  return (
    <StateMessage
      icon={ServerCrash}
      title={title}
      description={getErrorMessage(loadError)}
      isFramed={isFramed}
      action={
        <Button size="sm" colorPalette="brand" onClick={onRetry}>
          <RotateCw /> Tentar de novo
        </Button>
      }
    />
  );
}
