"use client";

import type { ErrorInfo } from "next/error";
import { PageLoadError } from "@/components/layout/page-load-error";

export default function RootError({ retry }: ErrorInfo) {
  return <PageLoadError retry={retry} />;
}
