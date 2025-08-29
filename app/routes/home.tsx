import type { Route } from "./+types/home";
import { Link } from "react-router";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Tennis Model Home" },
    { name: "description", content: "Tennis prediction and scraping app" },
  ];
}

export default function HomeRoute() {
  return (
    <div>
      <header className="bg-background border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">Tennis Model</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/model"
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-2 rounded-md text-sm font-medium"
              >
                Go to Model
              </Link>
            </div>
          </div>
        </div>
      </header>
      <main className="p-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-4">Welcome to the Tennis Model</h2>
          <p className="mb-4">This app scrapes tennis match data and provides predictions.</p>
          <div className="space-y-2">
            <p><Link to="/model" className="text-blue-500 hover:underline">Main Model Page</Link></p>
            <p><Link to="/model-simple" className="text-blue-500 hover:underline">Simple Test Route</Link></p>
          </div>
        </div>
      </main>
    </div>
  );
}
