"use client";

import { useState } from "react";
import { Drawer, Flex, IconButton, Portal } from "@chakra-ui/react";
import { Menu } from "lucide-react";
import type { SessionUser } from "@imc-calculator/shared";
import { Logo } from "@/components/layout/logo";
import { NavigationContent } from "./navigation-content";
import { EXPANDED_SIDEBAR_WIDTH } from "./sidebar-expansion";

/**
 * Top bar of phones and tablets, with the logo and the button that opens the menu in a
 * drawer. Following a link closes the drawer.
 */
export function MobileTopBar({ sessionUser }: { sessionUser: SessionUser }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
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
            <Drawer.Content bg="graphite.900" color="white" maxW={EXPANDED_SIDEBAR_WIDTH}>
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
  );
}
