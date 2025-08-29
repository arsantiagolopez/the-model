import type { MetaFunction } from "react-router";

export const meta: MetaFunction = () => {
  return [
    { title: "Tennis Model App" },
    { name: "description", content: "Tennis match predictions and scraping" },
  ];
};

export default function Index() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Tennis Model App</h1>
      <p className="mb-4">Welcome to the tennis scraping and prediction app.</p>
      
      <div className="space-y-2">
        <p><a href="/admin" className="text-blue-500 hover:underline">Admin Panel (Start Model)</a></p>
        <p><a href="/model" className="text-blue-500 hover:underline">Model Page (View Results)</a></p>
        <p><a href="/model-simple" className="text-blue-500 hover:underline">Simple Test Route</a></p>
      </div>
    </div>
  );
}