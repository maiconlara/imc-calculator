import { Flex } from "@chakra-ui/react";
import type { SessionUser } from "@imc-calculator/shared";
import { NavigationContent } from "./navigation-content";
import { COLLAPSED_SIDEBAR_WIDTH, EXPANDED_SIDEBAR_WIDTH } from "./sidebar-expansion";

/**
 * Menu of wide screens: a rail with the icons that expands over the page while it is
 * hovered or holds the keyboard focus.
 */
export function DesktopSidebar({ sessionUser }: { sessionUser: SessionUser }) {
  return (
    <Flex
      as="aside"
      data-sidebar=""
      direction="column"
      position="fixed"
      insetY="0"
      left="0"
      zIndex="sticky"
      w={COLLAPSED_SIDEBAR_WIDTH}
      bg="graphite.900"
      color="white"
      overflow="hidden"
      borderRightWidth="1px"
      borderColor="whiteAlpha.100"
      hideBelow="lg"
      transition="width 0.25s cubic-bezier(0.4, 0, 0.2, 1) 0.08s"
      css={{
        "&:hover, &:has(:focus-visible)": {
          width: EXPANDED_SIDEBAR_WIDTH,
          transitionDelay: "0s",
          boxShadow: "2xl",
        },
      }}
    >
      <NavigationContent sessionUser={sessionUser} isExpanded={false} />
    </Flex>
  );
}
