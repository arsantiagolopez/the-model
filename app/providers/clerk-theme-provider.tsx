"use client";

import { useTheme } from "next-themes";
import { dark } from "@clerk/themes";
import { ClerkProvider } from "@clerk/react-router";
import type { Route } from "../+types/root";
import { useIsMounted } from "~/lib/hooks/use-is-mounted";

export function ClerkThemeProvider({
  children,
  loaderData,
}: {
  children: React.ReactNode;
  loaderData: Route.ComponentProps["loaderData"];
}) {
  const isMounted = useIsMounted();
  const { resolvedTheme } = useTheme();
  const appearance =
    isMounted && resolvedTheme === "dark" ? { baseTheme: dark } : {};

  return (
    <ClerkProvider loaderData={loaderData} appearance={appearance}>
      {children}
    </ClerkProvider>
  );
}
