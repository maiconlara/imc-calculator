"use client";

import type { ComponentType } from "react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { Text, chakra } from "@chakra-ui/react";
import type { LucideProps } from "lucide-react";
import { PANEL_ROUTES, type PanelScreen } from "@/lib/routes";
import { getVisibleWhenExpandedStyle } from "../sidebar-expansion";

const NavLink = chakra(NextLink);

interface ScreenNavLinkProps {
  screen: PanelScreen;
  icon: ComponentType<LucideProps>;
  navLabel: string;
  isExpanded: boolean;
  onNavigate?: () => void;
}

/**
 * Menu link to one screen, highlighted while that screen or one of its sub-pages is
 * open.
 *
 * @param icon - Icon of the screen for the signed in role.
 * @param navLabel - Title of the screen for the signed in role.
 */
export function ScreenNavLink({
  screen,
  icon: NavIcon,
  navLabel,
  isExpanded,
  onNavigate,
}: ScreenNavLinkProps) {
  const pathname = usePathname();
  const screenRoute = PANEL_ROUTES[screen];
  const isActive = pathname === screenRoute || pathname.startsWith(`${screenRoute}/`);

  return (
    <li>
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
          css={getVisibleWhenExpandedStyle(isExpanded)}
        >
          {navLabel}
        </Text>
      </NavLink>
    </li>
  );
}
