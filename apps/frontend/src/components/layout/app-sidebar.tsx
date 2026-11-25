"use client";

import { useState, type ComponentType } from "react";
import NextLink from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Box,
  Center,
  Drawer,
  Flex,
  IconButton,
  Portal,
  Stack,
  Text,
  chakra,
} from "@chakra-ui/react";
import {
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  TrendingUp,
  Users,
  type LucideProps,
} from "lucide-react";
import { ROLE_LABELS, type Role, type SessionUser } from "@imc-calculator/shared";
import { useLogout } from "@/hooks";
import { getInitials } from "@/lib/formatters";
import { permissions } from "@/lib/permissions";
import { LOGIN_ROUTE, PANEL_ROUTES, PANEL_SCREENS, type PanelScreen } from "@/lib/routes";
import { getScreenTitle } from "@/lib/screen-titles";
import { Logo, LogoIcon } from "./logo";

const NAV_GROUP_LABELS = ["Acompanhamento", "Cadastros"] as const;

type NavGroupLabel = (typeof NAV_GROUP_LABELS)[number];

const SCREEN_NAV_GROUPS: Record<PanelScreen, NavGroupLabel> = {
  dashboard: "Acompanhamento",
  assessments: "Acompanhamento",
  users: "Cadastros",
};

const SCREEN_ICONS: Record<PanelScreen, (role: Role) => ComponentType<LucideProps>> = {
  dashboard: (role) => (role === "student" ? TrendingUp : LayoutDashboard),
  assessments: () => ClipboardList,
  users: () => Users,
};

const COLLAPSED_WIDTH = "72px";
const EXPANDED_WIDTH = "272px";
const EXPANDED_SIDEBAR_SELECTOR =
  "[data-sidebar]:hover &, [data-sidebar]:has(:focus-visible) &";

const NavLink = chakra(NextLink);

export function AppSidebar({ sessionUser }: { sessionUser: SessionUser }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <Flex
        as="aside"
        data-sidebar=""
        direction="column"
        position="fixed"
        insetY="0"
        left="0"
        zIndex="sticky"
        w={COLLAPSED_WIDTH}
        bg="graphite.900"
        color="white"
        overflow="hidden"
        borderRightWidth="1px"
        borderColor="whiteAlpha.100"
        hideBelow="lg"
        transition="width 0.25s cubic-bezier(0.4, 0, 0.2, 1) 0.08s"
        css={{
          "&:hover, &:has(:focus-visible)": {
            width: EXPANDED_WIDTH,
            transitionDelay: "0s",
            boxShadow: "2xl",
          },
        }}
      >
        <NavigationContent sessionUser={sessionUser} isExpanded={false} />
      </Flex>

      <Flex
        as="header"
        hideFrom="lg"
        position="sticky"
        top="0"
        zIndex="sticky"
        h="14"
        px="3"
        align="center"
        gap="2"
        bg="graphite.900"
        color="white"
      >
        <Drawer.Root
          open={isMenuOpen}
          onOpenChange={(event) => setIsMenuOpen(event.open)}
          placement="start"
        >
          <Drawer.Trigger asChild>
            <IconButton
              aria-label="Abrir menu"
              variant="ghost"
              color="white"
              _hover={{ bg: "whiteAlpha.200" }}
            >
              <Menu />
            </IconButton>
          </Drawer.Trigger>
          <Portal>
            <Drawer.Backdrop />
            <Drawer.Positioner>
              <Drawer.Content bg="graphite.900" color="white" maxW={EXPANDED_WIDTH}>
                <Drawer.Title srOnly>Menu de navegação</Drawer.Title>
                <NavigationContent
                  sessionUser={sessionUser}
                  isExpanded
                  onNavigate={() => setIsMenuOpen(false)}
                />
              </Drawer.Content>
            </Drawer.Positioner>
          </Portal>
        </Drawer.Root>
        <Logo background="dark" size={30} />
      </Flex>
    </>
  );
}

function NavigationContent({
  sessionUser,
  isExpanded,
  onNavigate,
}: {
  sessionUser: SessionUser;
  isExpanded: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
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

  const visibleWhenExpandedStyle = isExpanded
    ? { opacity: 1 }
    : {
        opacity: 0,
        transition: "opacity 0.2s",
        [EXPANDED_SIDEBAR_SELECTOR]: { opacity: 1 },
      };

  const visibleNavGroups = NAV_GROUP_LABELS.map((navGroupLabel) => ({
    label: navGroupLabel,
    screens: PANEL_SCREENS.filter(
      (screen) =>
        SCREEN_NAV_GROUPS[screen] === navGroupLabel &&
        permissions.canOpenScreen(sessionUser.role, screen),
    ),
  })).filter((navGroup) => navGroup.screens.length > 0);

  return (
    <Flex direction="column" h="full" minW={EXPANDED_WIDTH}>
      <Flex
        h="16"
        px="4"
        align="center"
        borderBottomWidth="1px"
        borderColor="whiteAlpha.100"
        flexShrink={0}
      >
        <Box position="relative" h="9">
          <Box
            position="absolute"
            css={
              isExpanded
                ? { opacity: 0 }
                : {
                    transition: "opacity 0.2s",
                    [EXPANDED_SIDEBAR_SELECTOR]: { opacity: 0 },
                  }
            }
          >
            <LogoIcon size={36} />
          </Box>
          <Box css={visibleWhenExpandedStyle}>
            <Logo background="dark" size={36} />
          </Box>
        </Box>
      </Flex>

      <Box as="nav" aria-label="Navegação do painel" flex="1" overflowY="auto" py="5">
        {visibleNavGroups.map((navGroup, navGroupIndex) => (
          <Box key={navGroup.label} mt={navGroupIndex > 0 ? "6" : "0"}>
            <Text
              px="5"
              mb="2"
              textStyle="monoLabel"
              color="whiteAlpha.600"
              whiteSpace="nowrap"
              css={visibleWhenExpandedStyle}
            >
              {navGroup.label}
            </Text>
            <Stack as="ul" gap="0.5" listStyleType="none">
              {navGroup.screens.map((screen) => {
                const screenRoute = PANEL_ROUTES[screen];
                const isActive =
                  pathname === screenRoute || pathname.startsWith(`${screenRoute}/`);
                const NavIcon = SCREEN_ICONS[screen](sessionUser.role);
                const navLabel = getScreenTitle(screen, sessionUser.role);
                return (
                  <li key={screen}>
                    <NavLink
                      href={screenRoute}
                      onClick={onNavigate}
                      aria-current={isActive ? "page" : undefined}
                      title={navLabel}
                      display="flex"
                      alignItems="center"
                      gap="3.5"
                      h="11"
                      pl={isActive ? "5" : "6"}
                      pr="3"
                      fontSize="sm"
                      fontWeight={isActive ? "700" : "500"}
                      color={isActive ? "white" : "whiteAlpha.800"}
                      borderLeftWidth={isActive ? "4px" : "0"}
                      borderColor="brand.solid"
                      bgGradient={isActive ? "to-r" : undefined}
                      gradientFrom={isActive ? "brand.solid/35" : undefined}
                      gradientTo="transparent"
                      transition="background 0.15s, color 0.15s"
                      _hover={{
                        color: "white",
                        bg: isActive ? undefined : "whiteAlpha.100",
                      }}
                      _focusVisible={{
                        outline: "2px solid",
                        outlineColor: "brand.solid",
                        outlineOffset: "-2px",
                      }}
                    >
                      <NavIcon size={18} aria-hidden="true" style={{ flexShrink: 0 }} />
                      <Text
                        as="span"
                        whiteSpace="nowrap"
                        truncate
                        css={visibleWhenExpandedStyle}
                      >
                        {navLabel}
                      </Text>
                    </NavLink>
                  </li>
                );
              })}
            </Stack>
          </Box>
        ))}
      </Box>

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
        <Flex flex="1" minW="0" align="center" gap="2" css={visibleWhenExpandedStyle}>
          <Box flex="1" minW="0">
            <Text fontSize="sm" fontWeight="600" truncate>
              {sessionUser.name}
            </Text>
            <Text textStyle="monoLabel" color="whiteAlpha.600">
              {ROLE_LABELS[sessionUser.role]}
            </Text>
          </Box>
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
        </Flex>
      </Flex>
    </Flex>
  );
}
