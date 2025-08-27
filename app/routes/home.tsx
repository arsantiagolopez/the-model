import type { Route } from "./+types/home";
import { SignedIn, SignedOut, UserButton } from "@clerk/react-router";
import { Link } from "react-router";
import { ThemeSwitch } from "~/components/theme-switch";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function HomeRoute() {
  return (
    <div>
      <header className="bg-background border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">Starter</h1>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeSwitch />
              <SignedOut>
                <Link
                  to="/login"
                  className="text-muted-foreground hover:text-foreground px-3 py-2 rounded-md text-sm font-medium"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-2 rounded-md text-sm font-medium"
                >
                  Register
                </Link>
              </SignedOut>
              <SignedIn>
                <UserButton />
              </SignedIn>
            </div>
          </div>
        </div>
      </header>
      <main>
        <SignedOut>
          <div>You're signed out</div>
        </SignedOut>
        <SignedIn>
          <div>You're signed in.</div>
        </SignedIn>
      </main>
    </div>
  );
}
