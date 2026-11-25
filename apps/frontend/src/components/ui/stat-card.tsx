import type { ComponentType, ReactNode } from "react";
import { Box, Card, Center, Flex, Text } from "@chakra-ui/react";
import type { LucideProps } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  icon: ComponentType<LucideProps>;
  hint?: ReactNode;
}

/**
 * Card with one number of the dashboard, its label, an icon and a short explanation.
 *
 * @param value - The number already formatted with `lib/formatters.ts`.
 * @param hint - Text or badge shown below the number.
 */
export function StatCard({ label, value, icon: StatIcon, hint }: StatCardProps) {
  return (
    <Card.Root variant="outline" borderRadius="l3" bg="bg.panel" h="full">
      <Card.Body p="5" gap="3">
        <Flex justify="space-between" align="start" gap="3">
          <Text textStyle="monoLabel" color="fg.muted">
            {label}
          </Text>
          <Center
            boxSize="9"
            flexShrink={0}
            borderRadius="l2"
            bg="brand.solid"
            color="brand.contrast"
          >
            <StatIcon size={18} aria-hidden="true" />
          </Center>
        </Flex>
        <Text
          fontFamily="heading"
          fontSize={{ base: "3xl", md: "4xl" }}
          fontWeight="900"
          lineHeight="1"
          letterSpacing="tight"
          css={{ fontVariantNumeric: "tabular-nums" }}
        >
          {value}
        </Text>
        {hint ? (
          <Box fontSize="xs" color="fg.muted">
            {hint}
          </Box>
        ) : null}
      </Card.Body>
    </Card.Root>
  );
}
