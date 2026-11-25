"use client";

import { useRouter } from "next/navigation";
import { IconButton } from "@chakra-ui/react";
import { LogOut } from "lucide-react";
import { useLogout } from "@/hooks";
import { LOGIN_ROUTE } from "@/lib/routes";

/**
 * Ends the session and goes to the login screen, even when the API call fails.
 */
export function LogoutButton() {
  const router = useRouter();
  const logoutMutation = useLogout();

  function handleLogout() {
    logoutMutation.mutate(undefined, {
      onSettled: () => {
        router.replace(LOGIN_ROUTE);
        router.refresh();
      },
    });
  }

  return (
    <IconButton
      aria-label="Sair do sistema"
      title="Sair"
      size="sm"
      variant="ghost"
      color="whiteAlpha.700"
      _hover={{ color: "white", bg: "whiteAlpha.200" }}
      onClick={handleLogout}
    >
      <LogOut />
    </IconButton>
  );
}
