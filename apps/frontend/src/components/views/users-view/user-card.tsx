import { Box, HStack, Text } from "@chakra-ui/react";
import { RoleBadge } from "@/components/ui/badges";
import { ListCard } from "@/components/ui/list-card";
import { UserAvatar } from "./user-avatar";
import { UserName } from "./user-name";
import { UserRowActions } from "./user-row-actions";
import { UserStatusControl } from "./user-status-control";
import type { UserRowProps } from "./users-view.types";

export function UserCard({ user, rowContext }: UserRowProps) {
  return (
    <ListCard
      summary={
        <>
          <HStack gap="3" minW="0">
            <UserAvatar user={user} />
            <Box minW="0">
              <Text fontWeight="700" truncate>
                <UserName user={user} sessionUserId={rowContext.sessionUserId} />
              </Text>
              <Text fontFamily="mono" fontSize="xs" color="fg.muted" truncate>
                {user.username}
              </Text>
            </Box>
          </HStack>
          {rowContext.canChooseRole ? <RoleBadge role={user.role} /> : null}
        </>
      }
      footer={
        <>
          <UserStatusControl user={user} rowContext={rowContext} />
          <UserRowActions user={user} rowContext={rowContext} />
        </>
      }
    />
  );
}
