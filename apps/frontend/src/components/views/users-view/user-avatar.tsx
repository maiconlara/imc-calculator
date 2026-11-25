import { Center } from "@chakra-ui/react";
import type { PublicUser } from "@imc-calculator/shared";
import { getInitials } from "@/lib/formatters";

export function UserAvatar({ user }: { user: PublicUser }) {
  const isActive = user.status === "active";
  return (
    <Center
      boxSize="8"
      flexShrink={0}
      borderRadius="full"
      bg={isActive ? "graphite.900" : "bg.muted"}
      color={isActive ? "brand.solid" : "fg.muted"}
      fontSize="2xs"
      fontWeight="800"
      aria-hidden="true"
    >
      {getInitials(user.name)}
    </Center>
  );
}
