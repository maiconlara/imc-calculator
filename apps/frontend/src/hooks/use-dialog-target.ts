"use client";

import { useState } from "react";

/**
 * State of a dialog that acts on one item. The item stays set while the dialog
 * closes, so its content does not disappear during the closing animation.
 *
 * @returns The item, whether the dialog is open, and the functions that open and close it.
 */
export function useDialogTarget<Target>() {
  const [target, setTarget] = useState<Target | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  function open(nextTarget: Target) {
    setTarget(nextTarget);
    setIsOpen(true);
  }

  return {
    target,
    isOpen,
    open,
    close: () => setIsOpen(false),
    onOpenChange: setIsOpen,
  };
}
