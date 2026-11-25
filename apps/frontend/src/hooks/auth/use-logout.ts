"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { logout } from "@/services";

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    onSettled: () => queryClient.clear(),
  });
}
