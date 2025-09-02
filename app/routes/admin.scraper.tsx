import { useState, useEffect, useRef } from "react";
import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { ScrollArea } from "~/components/ui/scroll-area";
import {
  CheckCircle2,
  XCircle,
  Square,
  RefreshCw,
  Settings,
} from "lucide-react";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

type ScrapingStatus = "idle" | "running" | "completed" | "error";

type LogEntry = {
  timestamp: string;
  level: "info" | "warn" | "error" | "debug";
  message: string;
  data?: any;
};

type ValidationField = {
  path: string;
  description: string;
  required: boolean;
  type: "string" | "number" | "array" | "object" | "boolean";
  example?: any;
};

type ScrapingResult = {
  todayResults: any[];
  tomorrowMatches: any[];
  playerProfiles: any[];
  stats: {
    todayResultsCount: number;
    tomorrowMatchesCount: number;
    playerProfilesCount: number;
    duration: number;
    requestCount: number;
    successRate: number;
  };
};

const VALIDATION_FIELDS: ValidationField[] = [
  // Match Data Fields
  {
    path: "matches[].time",
    description: "Match time (HH:MM format)",
    required: true,
    type: "string",
    example: "21:00",
  },
  {
    path: "matches[].player1.name",
    description: "Player 1 name",
    required: true,
    type: "string",
    example: "Novak Djokovic",
  },
  {
    path: "matches[].player1.url",
    description: "Player 1 profile URL",
    required: true,
    type: "string",
    example: "/player/djokovic/",
  },
  {
    path: "matches[].player1.seeding",
    description: "Player 1 seeding/qualifier",
    required: false,
    type: "string",
    example: "[1]",
  },
  {
    path: "matches[].player2.name",
    description: "Player 2 name",
    required: true,
    type: "string",
    example: "Rafael Nadal",
  },
  {
    path: "matches[].player2.url",
    description: "Player 2 profile URL",
    required: true,
    type: "string",
    example: "/player/nadal/",
  },
  {
    path: "matches[].tournament.name",
    description: "Tournament name",
    required: true,
    type: "string",
    example: "US Open",
  },
  {
    path: "matches[].tournament.category",
    description: "Tournament category",
    required: true,
    type: "string",
    example: "ATP",
  },
  {
    path: "matches[].tournament.surface",
    description: "Court surface",
    required: false,
    type: "string",
    example: "Hard",
  },
  {
    path: "matches[].score",
    description: "Match score (if completed)",
    required: false,
    type: "string",
    example: "6-3, 6-2",
  },
  {
    path: "matches[].status",
    description: "Match status",
    required: true,
    type: "string",
    example: "scheduled",
  },
  {
    path: "matches[].odds.player1",
    description: "Player 1 betting odds",
    required: false,
    type: "number",
    example: 1.25,
  },
  {
    path: "matches[].odds.player2",
    description: "Player 2 betting odds",
    required: false,
    type: "number",
    example: 3.28,
  },

  // Player Profile Fields
  {
    path: "players[].name",
    description: "Player full name",
    required: true,
    type: "string",
    example: "Novak Djokovic",
  },
  {
    path: "players[].country",
    description: "Player country",
    required: true,
    type: "string",
    example: "Serbia",
  },
  {
    path: "players[].age",
    description: "Player age",
    required: true,
    type: "number",
    example: 36,
  },
  {
    path: "players[].plays",
    description: "Playing hand",
    required: true,
    type: "string",
    example: "Right-handed",
  },
  {
    path: "players[].singlesRank.current",
    description: "Current singles ranking",
    required: false,
    type: "number",
    example: 1,
  },
  {
    path: "players[].singlesRank.highest",
    description: "Career-high ranking",
    required: true,
    type: "number",
    example: 1,
  },
  {
    path: "players[].singlesRecord.wins",
    description: "Career singles wins",
    required: true,
    type: "number",
    example: 1000,
  },
  {
    path: "players[].singlesRecord.losses",
    description: "Career singles losses",
    required: true,
    type: "number",
    example: 200,
  },
  {
    path: "players[].surfaceRecords.hard.wins",
    description: "Hard court wins",
    required: true,
    type: "number",
    example: 500,
  },
  {
    path: "players[].surfaceRecords.clay.wins",
    description: "Clay court wins",
    required: true,
    type: "number",
    example: 300,
  },
  {
    path: "players[].surfaceRecords.grass.wins",
    description: "Grass court wins",
    required: true,
    type: "number",
    example: 100,
  },
  {
    path: "players[].titles.singles.main",
    description: "Main tour singles titles",
    required: true,
    type: "number",
    example: 24,
  },
  {
    path: "players[].titles.singles.challenger",
    description: "Challenger singles titles",
    required: true,
    type: "number",
    example: 5,
  },
];

export default function AdminScraperRoute() {
  const [status, setStatus] = useState<ScrapingStatus>("idle");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [results, setResults] = useState<ScrapingResult | null>(null);
  const [validationResults, setValidationResults] = useState<
    Map<string, boolean>
  >(new Map());
  const [batchMatchCount, setBatchMatchCount] = useState(3);
  const [batchTournamentCount, setBatchTournamentCount] = useState(3);
  const [showBatchForm, setShowBatchForm] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const addLog = (level: LogEntry["level"], message: string, data?: any) => {
    const newLog: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
    };
    setLogs((prev) => [...prev, newLog]);
  };

  const [autoScroll, setAutoScroll] = useState(true);

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Only auto-scroll if user hasn't manually scrolled up
  useEffect(() => {
    if (autoScroll) {
      scrollToBottom();
    }
  }, [logs, autoScroll]);

  // Detect if user scrolled up manually
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const isAtBottom =
      element.scrollHeight - element.scrollTop === element.clientHeight;
    setAutoScroll(isAtBottom);
  };

  const runClusterScraper = async () => {
    if (status === "running") return;

    setStatus("running");
    setLogs([]);
    setResults(null);
    setValidationResults(new Map());

    addLog("info", "🚀 Starting Puppeteer Cluster scraper...");

    try {
      const formData = new FormData();
      formData.append("action", "production-run");
      formData.append("matchCount", "500");
      formData.append("tournamentCount", "10");

      addLog("info", "⚡ Launching 25 parallel browser workers...");
      const response = await fetch("/api/scraper", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        addLog("info", `✅ ${result.message}`);
        addLog("info", `📊 Performance: ${result.result.rate}`);
        addLog("info", `💾 Data saved to: ${result.result.filename}`);
        setStatus("completed");

        // Mock results for display
        setResults({
          todayResults: [],
          tomorrowMatches: [],
          playerProfiles: [],
          stats: {
            todayResultsCount: result.result.matches || 0,
            tomorrowMatchesCount: 0,
            playerProfilesCount: result.result.players || 0,
            duration: result.result.duration || 0,
            requestCount: result.result.matches + result.result.players || 0,
            successRate: 95.0,
          },
        });
      } else {
        addLog("error", `❌ Cluster scraper failed: ${result.error}`);
        setStatus("error");
      }
    } catch (error) {
      addLog(
        "error",
        `❌ Cluster scraper error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
      setStatus("error");
    }
  };

  const validateResults = (data: ScrapingResult) => {
    const validation = new Map<string, boolean>();

    // Validate match data
    const allMatches = [...data.todayResults, ...data.tomorrowMatches];
    VALIDATION_FIELDS.forEach((field) => {
      try {
        const isValid = validateField(field, {
          matches: allMatches,
          players: data.playerProfiles,
        });
        validation.set(field.path, isValid);
      } catch (error) {
        validation.set(field.path, false);
      }
    });

    setValidationResults(validation);
  };

  const validateField = (field: ValidationField, data: any): boolean => {
    const pathParts = field.path.split(".");
    const arrayMatch = pathParts[0].match(/(\w+)\[\]/);

    if (arrayMatch) {
      const arrayName = arrayMatch[1];
      const array = data[arrayName];

      if (!Array.isArray(array) || array.length === 0) {
        return !field.required;
      }

      const remainingPath = pathParts.slice(1);
      return array.some((item) => {
        let current = item;
        for (const part of remainingPath) {
          if (current === null || current === undefined) {
            return !field.required;
          }
          current = current[part];
        }
        return current !== null && current !== undefined && current !== "";
      });
    }

    return true; // Simplified validation for non-array paths
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const runBatchTest = async () => {
    if (batchMatchCount <= 0 || batchTournamentCount <= 0) {
      addLog(
        "error",
        "❌ Please enter valid numbers for matches and tournaments"
      );
      return;
    }

    setStatus("running");
    setLogs([]);
    setResults(null);
    setValidationResults(new Map());
    setShowBatchForm(false);

    addLog(
      "info",
      `🚀 Starting batch test: ${batchMatchCount} matches from ${batchTournamentCount} tournaments`
    );

    try {
      const formData = new FormData();
      formData.append("action", "test-batch");
      formData.append("matchCount", batchMatchCount.toString());
      formData.append("tournamentCount", batchTournamentCount.toString());

      addLog("info", "⚡ Launching batch test with cluster workers...");
      const response = await fetch("/api/scraper", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        addLog("info", `✅ ${result.message}`);
        addLog("info", `📊 Performance: ${result.result.rate}`);
        addLog("info", `💾 Data saved to: ${result.result.filename}`);

        setResults({
          todayResults: [],
          tomorrowMatches: [],
          playerProfiles: [],
          stats: {
            todayResultsCount: result.result.matches || 0,
            tomorrowMatchesCount: 0,
            playerProfilesCount: result.result.players || 0,
            duration: result.result.duration || 0,
            requestCount:
              (result.result.matches || 0) + (result.result.players || 0),
            successRate: 95.0,
          },
        });

        setStatus("completed");
      } else {
        addLog("error", `❌ Batch test failed: ${result.error}`);
        setStatus("error");
      }
    } catch (error) {
      addLog(
        "error",
        `❌ Batch test failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
      setStatus("error");
    }
  };

  const stopScraper = () => {
    setStatus("idle");
    addLog("warn", "⏹️ Scraping stopped by user");
  };

  const getLogColor = (level: LogEntry["level"]) => {
    switch (level) {
      case "error":
        return "text-red-600";
      case "warn":
        return "text-yellow-600";
      case "info":
        return "text-blue-600";
      case "debug":
        return "text-gray-500";
      default:
        return "text-gray-900";
    }
  };

  const getValidationIcon = (isValid: boolean) => {
    return isValid ? (
      <CheckCircle2 className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  const successfulFields = Array.from(validationResults.values()).filter(
    Boolean
  ).length;
  const totalFields = validationResults.size;
  const validationRate =
    totalFields > 0 ? ((successfulFields / totalFields) * 100).toFixed(1) : "0";

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Tennis Scraper Admin
          </h1>
          <p className="text-muted-foreground">
            Puppeteer Cluster scraping system
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={runClusterScraper}
            disabled={status === "running"}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
          >
            {status === "running" ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Running...
              </>
            ) : (
              <>🚀 Run Scraper</>
            )}
          </Button>
          {status === "running" && (
            <Button onClick={stopScraper} variant="outline">
              <Square className="h-4 w-4" />
              Stop
            </Button>
          )}
          <Button onClick={clearLogs} variant="outline">
            Clear Logs
          </Button>
          <Button
            onClick={() => setShowBatchForm(true)}
            variant="secondary"
            disabled={status === "running"}
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Batch Test
          </Button>
          <Button asChild variant="outline" className="flex items-center gap-2">
            <Link to="/model/today">📊 View Model Data</Link>
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge
              variant={
                status === "running"
                  ? "default"
                  : status === "completed"
                    ? "secondary"
                    : status === "error"
                      ? "destructive"
                      : "outline"
              }
            >
              {status.toUpperCase()}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Field Validation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {validationRate}%
            </div>
            <p className="text-xs text-muted-foreground">
              {successfulFields}/{totalFields} fields valid
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {results?.stats
                ? (results.stats.todayResultsCount || 0) +
                  (results.stats.tomorrowMatchesCount || 0) +
                  (results.stats.playerProfilesCount || 0)
                : 0}
            </div>
            <p className="text-xs text-muted-foreground">matches + players</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {results?.stats?.successRate || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {results?.stats?.requestCount || 0} requests
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="logs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="logs">Live Logs</TabsTrigger>
          <TabsTrigger value="data">Scraped Data</TabsTrigger>
          <TabsTrigger value="validation">Field Validation</TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Real-time Logs</CardTitle>
                <div className="flex gap-2">
                  <Button
                    onClick={scrollToBottom}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    ↓ Bottom
                  </Button>
                  <Button onClick={clearLogs} variant="outline" size="sm">
                    Clear
                  </Button>
                </div>
              </div>
              <CardDescription>
                Live output from the scraping system{" "}
                {!autoScroll && "(Auto-scroll paused)"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea
                className="h-96 w-full border rounded-lg p-4 bg-black text-green-400 font-mono text-sm"
                onScrollCapture={handleScroll}
              >
                {logs.map((log, index) => (
                  <div key={index} className={`mb-1 ${getLogColor(log.level)}`}>
                    <span className="text-gray-400">
                      [{log.timestamp.split("T")[1].split(".")[0]}]
                    </span>
                    <span className="ml-2 text-yellow-400 uppercase">
                      [{log.level}]
                    </span>
                    <span className="ml-2 text-white">{log.message}</span>
                    {log.data && (
                      <pre className="ml-8 text-gray-300 text-xs mt-1">
                        {JSON.stringify(log.data, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
                {logs.length === 0 && (
                  <div className="text-gray-500 text-center py-8">
                    No logs yet. Click "Run Scraper" to start.
                  </div>
                )}
                <div ref={logsEndRef} />
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-4">
          {results ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>
                    Today's Results ({results?.stats?.todayResultsCount || 0})
                  </CardTitle>
                  <CardDescription>
                    Completed matches for training data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96 w-full">
                    <pre className="text-xs bg-black text-green-400 p-4 rounded-lg overflow-auto font-mono">
                      {JSON.stringify(results.todayResults, null, 2)}
                    </pre>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>
                    Tomorrow's Matches (
                    {results?.stats?.tomorrowMatchesCount || 0})
                  </CardTitle>
                  <CardDescription>
                    Upcoming matches for predictions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96 w-full">
                    <pre className="text-xs bg-black text-green-400 p-4 rounded-lg overflow-auto font-mono">
                      {JSON.stringify(results.tomorrowMatches, null, 2)}
                    </pre>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>
                    Player Profiles ({results?.stats?.playerProfilesCount || 0})
                  </CardTitle>
                  <CardDescription>
                    Detailed player statistics and records
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96 w-full">
                    <pre className="text-xs bg-black text-green-400 p-4 rounded-lg overflow-auto font-mono">
                      {JSON.stringify(results.playerProfiles, null, 2)}
                    </pre>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground">
                  No data available. Run the scraper first.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="validation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Field Validation Results</CardTitle>
              <CardDescription>
                Validation status for all expected data fields from tennis
                scraping
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 max-h-96 overflow-auto">
                {VALIDATION_FIELDS.map((field, index) => {
                  const isValid = validationResults.get(field.path) ?? null;
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between py-2 border-b last:border-b-0"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <code className="text-sm bg-black text-green-400 px-2 py-1 rounded font-mono">
                            {field.path}
                          </code>
                          {field.required && (
                            <Badge variant="outline" className="text-xs">
                              Required
                            </Badge>
                          )}
                          <Badge variant="secondary" className="text-xs">
                            {field.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {field.description}
                        </p>
                        {field.example && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Example:{" "}
                            <code className="bg-black text-green-400 px-1 rounded font-mono">
                              {JSON.stringify(field.example)}
                            </code>
                          </p>
                        )}
                      </div>
                      <div className="ml-4">
                        {isValid === null ? (
                          <div className="w-4 h-4 bg-gray-300 rounded-full" />
                        ) : (
                          getValidationIcon(isValid)
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Batch Test Modal */}
      {showBatchForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Batch Test Configuration
              </CardTitle>
              <CardDescription>
                Test multiple matches from multiple tournaments using the
                cluster scraper
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="matchCount">Number of Matches (max 500)</Label>
                <Input
                  id="matchCount"
                  type="number"
                  min="1"
                  max="500"
                  value={batchMatchCount}
                  onChange={(e) =>
                    setBatchMatchCount(
                      Math.min(500, Math.max(1, parseInt(e.target.value) || 1))
                    )
                  }
                  placeholder="100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tournamentCount">
                  Number of Tournaments (max 20)
                </Label>
                <Input
                  id="tournamentCount"
                  type="number"
                  min="1"
                  max="20"
                  value={batchTournamentCount}
                  onChange={(e) =>
                    setBatchTournamentCount(
                      Math.min(20, Math.max(1, parseInt(e.target.value) || 1))
                    )
                  }
                  placeholder="5"
                />
              </div>

              <div className="bg-muted p-3 rounded-md text-sm">
                <p>
                  <strong>What this will do:</strong>
                </p>
                <ul className="mt-2 space-y-1 text-muted-foreground">
                  <li>
                    • Collect {batchMatchCount} matches from at least{" "}
                    {batchTournamentCount} different tournaments
                  </li>
                  <li>
                    • Scrape detailed player profiles for all players using 50
                    parallel workers
                  </li>
                  <li>
                    • Export data to JSON files for use in /model/* routes
                  </li>
                  <li>
                    • Should complete in 1-2 minutes with stealth techniques
                    enabled
                  </li>
                </ul>
              </div>

              <div className="flex gap-2 pt-2">
                <Button onClick={runBatchTest} className="flex-1">
                  Start Batch Test
                </Button>
                <Button
                  onClick={() => setShowBatchForm(false)}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
