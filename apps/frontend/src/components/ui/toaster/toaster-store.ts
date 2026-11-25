"use client";

import { createToaster } from "@chakra-ui/react";

/**
 * Queue of the panel toasts, read by the `Toaster` component.
 */
export const toaster = createToaster({
  placement: "bottom-end",
  pauseOnPageIdle: true,
  max: 4,
});

/**
 * Shows a success toast, or an error toast that stays on screen longer.
 */
export const notify = {
  success: (title: string) => toaster.create({ type: "success", title, closable: true }),
  error: (title: string) =>
    toaster.create({ type: "error", title, closable: true, duration: 7000 }),
};
