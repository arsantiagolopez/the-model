import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { useLoaderData } from "react-router";
import { ModelScrapeButton } from "~/components/model-scrape-button";

export const meta: MetaFunction = () => {
  return [
    { title: "Model Test | Tennis App" },
    { name: "description", content: "Tennis model test page" },
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

export default function ModelTestPage() {
  const { tomorrow } = useLoaderData<typeof loader>();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Model Test Page</h1>
      <p className="mb-4">Tomorrow: {tomorrow}</p>
      
      <div className="mb-6 p-4 border-b bg-muted/50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Model Control</h2>
            <p className="text-sm text-muted-foreground">
              Start the scraping process to populate tomorrow's tennis matches
            </p>
          </div>
          <ModelScrapeButton />
        </div>
      </div>
      
      <p>This is a simplified model page to test the scrape button functionality.</p>
    </div>
  );
}