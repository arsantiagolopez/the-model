import type { ActionFunctionArgs } from "react-router";
import { logStore } from "./stream";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return Response.json(
      { success: false, error: "Method not allowed" },
      { status: 405 }
    );
  }

  // Add some test logs
  logStore.addLog("🧪 Test log entry 1");
  await new Promise(resolve => setTimeout(resolve, 500));
  logStore.addLog("🧪 Test log entry 2");
  await new Promise(resolve => setTimeout(resolve, 500));
  logStore.addLog("🧪 Test log entry 3");
  await new Promise(resolve => setTimeout(resolve, 500));
  logStore.addLog("✅ Test completed successfully!");

  return Response.json({ success: true, message: "Test logs added" });
}