import { Flex } from "@chakra-ui/react";
import type { SessionUser } from "@imc-calculator/shared";
import { EXPANDED_SIDEBAR_WIDTH } from "../sidebar-expansion";
import { ScreenNavigation } from "./screen-navigation";
import { SessionUserArea } from "./session-user-area";
import { SidebarBrand } from "./sidebar-brand";

interface NavigationContentProps {
  sessionUser: SessionUser;
  isExpanded: boolean;
  onNavigate?: () => void;
}

/**
 * Content of the menu, shared by the desktop rail and the phone drawer: the logo, the
 * screen links and the signed in user.
 *
 * @param isExpanded - Whether the menu is always expanded, as in the phone drawer.
 * @param onNavigate - Called when a link is followed, so the drawer can close.
 */
export function NavigationContent({
  sessionUser,
  isExpanded,
  onNavigate,
}: NavigationContentProps) {
  return (
    <Flex direction="column" h="full" minW={EXPANDED_SIDEBAR_WIDTH}>
      <SidebarBrand isExpanded={isExpanded} />
      <ScreenNavigation
        role={sessionUser.role}
        isExpanded={isExpanded}
        onNavigate={onNavigate}
      />
      <SessionUserArea sessionUser={sessionUser} isExpanded={isExpanded} />
    </Flex>
  );
}
