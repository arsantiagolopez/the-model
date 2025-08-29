import { useEffect, useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Trash2, Download } from "lucide-react";

interface LogEntry {
  type: 'log' | 'clear' | 'heartbeat';
  message?: string;
}

export function LogsViewer() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    // Connect to SSE endpoint
    const connectToLogs = () => {
      const eventSource = new EventSource('/api/logs/stream');
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setIsConnected(true);
        console.log('✅ Connected to log stream');
      };

      eventSource.onmessage = (event) => {
        try {
          const data: LogEntry = JSON.parse(event.data);
          
          if (data.type === 'log' && data.message) {
            setLogs(prev => [...prev, data.message!]);
          } else if (data.type === 'clear') {
            setLogs([]);
          }
          // Ignore heartbeat messages
        } catch (error) {
          console.error('Error parsing log message:', error);
        }
      };

      eventSource.onerror = () => {
        setIsConnected(false);
        console.log('❌ Log stream connection error, retrying...');
        
        // Retry connection after 3 seconds
        setTimeout(() => {
          if (eventSourceRef.current?.readyState === EventSource.CLOSED) {
            connectToLogs();
          }
        }, 3000);
      };
    };

    connectToLogs();

    // Cleanup on unmount
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, []);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const clearLogs = () => {
    setLogs([]);
  };

  const downloadLogs = () => {
    const logText = logs.join('\\n');
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scraping-logs-${new Date().toISOString().slice(0, 19)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 border bg-card rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Scraping Logs</h3>
          <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm text-muted-foreground">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={downloadLogs}
            disabled={logs.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={clearLogs}
            disabled={logs.length === 0}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear
          </Button>
        </div>
      </div>
      
      <ScrollArea className="h-[50vh] w-full rounded border bg-muted/50">
        <div ref={scrollRef} className="p-4 space-y-1">
          {logs.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No logs yet. Start the model scraping to see logs here.
            </p>
          ) : (
            logs.map((log, index) => (
              <div
                key={index}
                className="font-mono text-xs leading-relaxed text-foreground"
              >
                {log}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
      
      <div className="mt-2 text-xs text-muted-foreground">
        {logs.length > 0 && (
          <span>{logs.length} log {logs.length === 1 ? 'entry' : 'entries'}</span>
        )}
      </div>
    </div>
  );
}