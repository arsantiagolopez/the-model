import type { MetaFunction } from "react-router";

export const meta: MetaFunction = () => {
  return [
    { title: "Simple Model Test" },
  ];
};

export default function ModelSimple() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Simple Model Test</h1>
      <p>If you can see this, React is working correctly.</p>
      <button 
        onClick={() => alert("Button clicked!")}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Test Button
      </button>
    </div>
  );
}