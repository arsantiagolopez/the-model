import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { useLoaderData } from "react-router";
import { ModelScrapeButton } from "~/components/model-scrape-button";
import { LogsViewer } from "~/components/logs-viewer";

export const meta: MetaFunction = () => {
  return [
    { title: "Admin | Tennis Model" },
    { name: "description", content: "Admin panel for tennis model management" },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });

  return { tomorrow };
}

export default function AdminPage() {
  const { tomorrow } = useLoaderData<typeof loader>();

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Tennis Model Admin</h1>
      
      <div className="grid gap-6">
        {/* Model Control Section */}
        <div className="p-6 border bg-card rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold mb-2">Model Control</h2>
              <p className="text-muted-foreground">
                Start the scraping process to populate tomorrow's tennis matches ({tomorrow})
              </p>
            </div>
            <ModelScrapeButton />
          </div>
        </div>

        {/* Status Section */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-6 border bg-card rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Scraping Status</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Last Scrape:</span>
                <span className="text-muted-foreground">Not started</span>
              </div>
              <div className="flex justify-between">
                <span>Matches Found:</span>
                <span className="text-muted-foreground">0</span>
              </div>
              <div className="flex justify-between">
                <span>Players Found:</span>
                <span className="text-muted-foreground">0</span>
              </div>
            </div>
          </div>

          <div className="p-6 border bg-card rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Database Status</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total Matches:</span>
                <span className="text-muted-foreground">Loading...</span>
              </div>
              <div className="flex justify-between">
                <span>Total Players:</span>
                <span className="text-muted-foreground">Loading...</span>
              </div>
              <div className="flex justify-between">
                <span>Total Tournaments:</span>
                <span className="text-muted-foreground">Loading...</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions Section */}
        <div className="p-6 border bg-card rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Admin Actions</h3>
          <div className="flex flex-wrap gap-3">
            <button 
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/80"
              onClick={async () => {
                try {
                  await fetch("/api/logs/test", { method: "POST" });
                } catch (error) {
                  console.error("Test failed:", error);
                }
              }}
            >
              Test Logs
            </button>
            <button className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/80">
              Clear Data
            </button>
            <button className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/80">
              Export Data
            </button>
            <a 
              href="/model" 
              className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
            >
              View Model
            </a>
          </div>
        </div>

        {/* Live Logs Section */}
        <LogsViewer />
      </div>
    </div>
  );
}