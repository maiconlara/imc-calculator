import type { SystemStyleObject } from "@chakra-ui/react";

export const COLLAPSED_SIDEBAR_WIDTH = "72px";
export const EXPANDED_SIDEBAR_WIDTH = "272px";

const EXPANDED_SIDEBAR_SELECTOR =
  "[data-sidebar]:hover &, [data-sidebar]:has(:focus-visible) &";

/**
 * Style of the menu parts that only show while the menu is expanded: always in the
 * phone drawer, and on the desktop rail while it is hovered or focused.
 *
 * @param isExpanded - Whether the menu is always expanded, as in the phone drawer.
 */
export function getVisibleWhenExpandedStyle(isExpanded: boolean): SystemStyleObject {
  return isExpanded
    ? { opacity: 1 }
    : {
        opacity: 0,
        transition: "opacity 0.2s",
        [EXPANDED_SIDEBAR_SELECTOR]: { opacity: 1 },
      };
}

/**
 * Style of the menu parts that only show while the desktop rail is collapsed.
 *
 * @param isExpanded - Whether the menu is always expanded, as in the phone drawer.
 */
export function getHiddenWhenExpandedStyle(isExpanded: boolean): SystemStyleObject {
  return isExpanded
    ? { opacity: 0 }
    : {
        transition: "opacity 0.2s",
        [EXPANDED_SIDEBAR_SELECTOR]: { opacity: 0 },
      };
}
