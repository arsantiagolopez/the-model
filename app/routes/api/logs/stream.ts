import type { LoaderFunctionArgs } from "react-router";

// Simple in-memory log store for demo purposes
// In production, you'd want to use Redis or a proper message queue
class LogStore {
  private logs: string[] = [];
  private subscribers = new Set<(log: string) => void>();

  addLog(message: string) {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    this.logs.push(logEntry);
    
    // Keep only last 1000 logs
    if (this.logs.length > 1000) {
      this.logs.shift();
    }

    // Notify all subscribers
    this.subscribers.forEach(callback => callback(logEntry));
  }

  subscribe(callback: (log: string) => void) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  getRecentLogs(count = 100): string[] {
    return this.logs.slice(-count);
  }

  clear() {
    this.logs = [];
    this.subscribers.forEach(callback => callback('CLEAR_LOGS'));
  }
}

export const logStore = new LogStore();

export async function loader({ request }: LoaderFunctionArgs) {
  // Check if this is an SSE request
  const accept = request.headers.get('Accept');
  if (!accept?.includes('text/event-stream')) {
    return new Response("Expected text/event-stream", { status: 400 });
  }

  // Create readable stream for SSE
  const stream = new ReadableStream({
    start(controller) {
      // Send recent logs immediately
      const recentLogs = logStore.getRecentLogs();
      recentLogs.forEach(log => {
        controller.enqueue(`data: ${JSON.stringify({ type: 'log', message: log })}\n\n`);
      });

      // Subscribe to new logs
      const unsubscribe = logStore.subscribe((log) => {
        if (log === 'CLEAR_LOGS') {
          controller.enqueue(`data: ${JSON.stringify({ type: 'clear' })}\n\n`);
        } else {
          controller.enqueue(`data: ${JSON.stringify({ type: 'log', message: log })}\n\n`);
        }
      });

      // Keep connection alive with heartbeat
      const heartbeat = setInterval(() => {
        controller.enqueue(`data: ${JSON.stringify({ type: 'heartbeat' })}\n\n`);
      }, 30000);

      // Cleanup on close
      const cleanup = () => {
        clearInterval(heartbeat);
        unsubscribe();
        controller.close();
      };

      // Handle client disconnect
      request.signal.addEventListener('abort', cleanup);
      
      // Auto-cleanup after 10 minutes
      setTimeout(cleanup, 10 * 60 * 1000);
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    }
  });
}