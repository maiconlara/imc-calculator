import type { ReactNode } from "react";
import { Card, Flex } from "@chakra-ui/react";

interface ListCardProps {
  summary: ReactNode;
  footer: ReactNode;
  summaryAlign?: "center" | "start";
}

/**
 * Card that replaces a table row on phones: the main information on top, the status
 * and the row actions at the bottom.
 *
 * @param props - Content of the top and bottom lines.
 */
export function ListCard({ summary, footer, summaryAlign = "center" }: ListCardProps) {
  return (
    <Card.Root variant="outline" borderRadius="l3" bg="bg.panel">
      <Card.Body p="4" gap="3">
        <Flex justify="space-between" align={summaryAlign} gap="3">
          {summary}
        </Flex>
        <Flex justify="space-between" align="center" gap="3">
          {footer}
        </Flex>
      </Card.Body>
    </Card.Root>
  );
}
