import { Box, Flex } from "@chakra-ui/react";
import { Logo, LogoIcon } from "@/components/layout/logo";
import {
  getHiddenWhenExpandedStyle,
  getVisibleWhenExpandedStyle,
} from "../sidebar-expansion";

/**
 * Top of the menu: the logo icon on the collapsed rail, and the full logo once the
 * menu expands.
 *
 * @param isExpanded - Whether the menu is always expanded, as in the phone drawer.
 */
export function SidebarBrand({ isExpanded }: { isExpanded: boolean }) {
  return (
    <Flex
      h="16"
      px="4"
      align="center"
      borderBottomWidth="1px"
      borderColor="whiteAlpha.100"
      flexShrink={0}
    >
      <Box position="relative" h="9">
        <Box position="absolute" css={getHiddenWhenExpandedStyle(isExpanded)}>
          <LogoIcon size={36} />
        </Box>
        <Box css={getVisibleWhenExpandedStyle(isExpanded)}>
          <Logo background="dark" size={36} />
        </Box>
      </Box>
    </Flex>
  );
}
