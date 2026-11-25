import { Text } from "@chakra-ui/react";
import type { PublicUser } from "@imc-calculator/shared";

export function UserName({
  user,
  sessionUserId,
}: {
  user: PublicUser;
  sessionUserId: string;
}) {
  return (
    <>
      {user.name}
      {user.id === sessionUserId ? (
        <Text as="span" ml="2" textStyle="monoLabel" color="fg.muted">
          (você)
        </Text>
      ) : null}
    </>
  );
}
