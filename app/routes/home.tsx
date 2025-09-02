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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold tracking-tight">Welcome to The Model</h2>
              <p className="text-muted-foreground">Enterprise tennis data scraping and AI betting predictions</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Link
                to="/admin/scraper"
                className="block p-6 bg-card hover:bg-accent hover:text-accent-foreground rounded-lg border transition-colors"
              >
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">🎾 Tennis Scraper Admin</h3>
                  <p className="text-sm text-muted-foreground">
                    Monitor and test the enterprise tennis scraping system. Run scrapers, view logs, and validate data quality.
                  </p>
                </div>
              </Link>

              <div className="p-6 bg-card rounded-lg border opacity-50">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">📊 AI Predictions</h3>
                  <p className="text-sm text-muted-foreground">
                    View AI-generated betting predictions based on scraped tennis data. (Coming Soon)
                  </p>
                </div>
              </div>

              <div className="p-6 bg-card rounded-lg border opacity-50">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">💰 Betting Analysis</h3>
                  <p className="text-sm text-muted-foreground">
                    Track odds movements and identify profitable betting opportunities. (Coming Soon)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </SignedIn>
      </main>
    </div>
  );
}
