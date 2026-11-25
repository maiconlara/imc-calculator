import { Box, Center, Flex, Text } from "@chakra-ui/react";
import { ROLE_LABELS, type SessionUser } from "@imc-calculator/shared";
import { getInitials } from "@/lib/formatters";
import { getVisibleWhenExpandedStyle } from "../sidebar-expansion";
import { LogoutButton } from "./logout-button";

interface SessionUserAreaProps {
  sessionUser: SessionUser;
  isExpanded: boolean;
}

/**
 * Bottom of the menu: the initials, name and role of the signed in user, and the
 * logout button.
 */
export function SessionUserArea({ sessionUser, isExpanded }: SessionUserAreaProps) {
  return (
    <Flex
      align="center"
      gap="3"
      px="4"
      py="4"
      borderTopWidth="1px"
      borderColor="whiteAlpha.100"
      flexShrink={0}
    >
      <Center
        boxSize="9"
        flexShrink={0}
        borderRadius="full"
        bg="brand.solid"
        color="brand.contrast"
        fontSize="xs"
        fontWeight="800"
      >
        {getInitials(sessionUser.name)}
      </Center>
      <Flex
        flex="1"
        minW="0"
        align="center"
        gap="2"
        css={getVisibleWhenExpandedStyle(isExpanded)}
      >
        <Box flex="1" minW="0">
          <Text fontSize="sm" fontWeight="600" truncate>
            {sessionUser.name}
          </Text>
          <Text textStyle="monoLabel" color="whiteAlpha.600">
            {ROLE_LABELS[sessionUser.role]}
          </Text>
        </Box>
        <LogoutButton />
      </Flex>
    </Flex>
  );
}
