"use client";

import type { ComponentType, ReactNode } from "react";
import { EmptyState, VStack } from "@chakra-ui/react";
import type { LucideProps } from "lucide-react";

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
 * @param isFullPage - Adds the vertical space of a message that replaces a whole page.
 */
export function StateMessage({
  icon: StateIcon,
  title,
  description,
  action,
  isFramed = false,
  isFullPage = false,
}: StateMessageContent & { isFramed?: boolean; isFullPage?: boolean }) {
  return (
    <EmptyState.Root
      py={isFullPage ? "24" : isFramed ? "12" : "8"}
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
