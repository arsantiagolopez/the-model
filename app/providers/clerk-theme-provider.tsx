import { ClerkProvider } from "@clerk/react-router";
import type { Route } from "../+types/root";

export function ClerkThemeProvider({
  children,
  loaderData,
}: {
  children: React.ReactNode;
  loaderData: Route.ComponentProps["loaderData"];
}) {
  return (
    <ClerkProvider loaderData={loaderData}>
      {children}
    </ClerkProvider>
  );
}
