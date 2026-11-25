import { Box, Stack, Text } from "@chakra-ui/react";
import type { Role } from "@imc-calculator/shared";
import { getScreenTitle } from "@/lib/screen-titles";
import { getVisibleWhenExpandedStyle } from "../sidebar-expansion";
import { SCREEN_ICONS, getVisibleNavGroups } from "../sidebar-navigation";
import { ScreenNavLink } from "./screen-nav-link";

interface ScreenNavigationProps {
  role: Role;
  isExpanded: boolean;
  onNavigate?: () => void;
}

/**
 * Menu groups with the links to the screens the role may open.
 */
export function ScreenNavigation({
  role,
  isExpanded,
  onNavigate,
}: ScreenNavigationProps) {
  return (
    <Box as="nav" aria-label="Navegação do painel" flex="1" overflowY="auto" py="5">
      {getVisibleNavGroups(role).map((navGroup, navGroupIndex) => (
        <Box key={navGroup.label} mt={navGroupIndex > 0 ? "6" : "0"}>
          <Text
            px="5"
            mb="2"
            textStyle="monoLabel"
            color="whiteAlpha.600"
            whiteSpace="nowrap"
            css={getVisibleWhenExpandedStyle(isExpanded)}
          >
            {navGroup.label}
          </Text>
          <Stack as="ul" gap="0.5" listStyleType="none">
            {navGroup.screens.map((screen) => (
              <ScreenNavLink
                key={screen}
                screen={screen}
                icon={SCREEN_ICONS[screen](role)}
                navLabel={getScreenTitle(screen, role)}
                isExpanded={isExpanded}
                onNavigate={onNavigate}
              />
            ))}
          </Stack>
        </Box>
      ))}
    </Box>
  );
}
