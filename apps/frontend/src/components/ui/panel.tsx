import type { ReactNode } from "react";
import { Box, Card, Flex, Heading, Text } from "@chakra-ui/react";

interface PanelProps {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}

export function Panel({ title, description, action, children }: PanelProps) {
  return (
    <Card.Root variant="outline" borderRadius="l3" bg="bg.panel" h="full">
      <Card.Header pb="0">
        <Flex justify="space-between" align="start" gap="3">
          <Box>
            <Heading
              as="h2"
              fontSize="sm"
              fontWeight="800"
              textTransform="uppercase"
              letterSpacing="wide"
            >
              {title}
            </Heading>
            {description ? (
              <Text mt="1" fontSize="xs" color="fg.muted">
                {description}
              </Text>
            ) : null}
          </Box>
          {action}
        </Flex>
      </Card.Header>
      <Card.Body>{children}</Card.Body>
    </Card.Root>
  );
}
