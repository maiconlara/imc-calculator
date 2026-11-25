import type { ReactNode } from "react";
import { Flex, HStack, Heading } from "@chakra-ui/react";

interface PageHeaderProps {
  title: string;
  actions?: ReactNode;
}

export function PageHeader({ title, actions }: PageHeaderProps) {
  return (
    <Flex
      as="header"
      minH="16"
      py="3"
      px={{ base: "4", lg: "8" }}
      bg="bg.panel"
      borderBottomWidth="1px"
      align="center"
      justify="space-between"
      gap="3"
    >
      <Heading
        as="h1"
        minW="0"
        fontSize={{ base: "lg", md: "xl" }}
        fontWeight="900"
        textTransform="uppercase"
        letterSpacing="tight"
        lineHeight="1.1"
        truncate
      >
        {title}
      </Heading>
      {actions ? (
        <HStack gap="2" flexShrink={0}>
          {actions}
        </HStack>
      ) : null}
    </Flex>
  );
}
