"use client";

import { Button } from "@chakra-ui/react";
import { RotateCw, ServerCrash } from "lucide-react";
import { getErrorMessage } from "@/lib/api-errors";
import { StateMessage } from "./state-message";

/**
 * Failed load of a list or block, with the reason and a button that fetches it again.
 * It replaces the data, so a failure never looks like an empty list.
 */
export function LoadErrorMessage({
  title,
  loadError,
  onRetry,
  isFramed = false,
}: {
  title: string;
  loadError: Error;
  onRetry: () => void;
  isFramed?: boolean;
}) {
  return (
    <StateMessage
      icon={ServerCrash}
      title={title}
      description={getErrorMessage(loadError)}
      isFramed={isFramed}
      action={
        <Button size="sm" colorPalette="brand" onClick={onRetry}>
          <RotateCw /> Tentar de novo
        </Button>
      }
    />
  );
}
