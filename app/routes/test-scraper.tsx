import React, { useState } from "react";

export default function TestScraperPage() {
  const [selectedTest, setSelectedTest] = useState("schedule-raw");
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [testData, setTestData] = useState<any>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const resultsRef = React.useRef<HTMLDivElement>(null);

  const runTest = async (testType: string) => {
    setIsRunning(true);
    setStartTime(new Date());
    setTestError(null);
    setTestData(null);
    
    try {
      console.log("Starting test:", testType);
      const formData = new FormData();
      formData.append("testType", testType);
      
      const response = await fetch("/api/test-scraper", {
        method: "POST",
        body: formData
      });
      
      console.log("Response status:", response.status);
      console.log("Response headers:", Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Response data:", data);
      setTestData(data);
      
      setIsRunning(false);
      
      // Auto-scroll to results after a brief delay
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start',
          inline: 'nearest'
        });
      }, 300);
    } catch (error) {
      console.error("Fetch error:", error);
      setTestError(error instanceof Error ? error.message : "Unknown error");
      setIsRunning(false);
    }
  };


  const tests = [
    {
      id: "tournament-list",
      name: "🏆 Tournament List",
      description: "Test tournament list scraping with validation",
      category: "Tournament"
    },
    {
      id: "tournament-details",
      name: "🏆 Tournament Details", 
      description: "Test detailed tournament data (surface, prize, location)",
      category: "Tournament"
    },
    {
      id: "match-data",
      name: "⚾ Match Data",
      description: "Test match scraping (players, odds, h2h)",
      category: "Match"
    },
    {
      id: "match-details",
      name: "⚾ Match Details",
      description: "Test match detail page scraping (stats, score)", 
      category: "Match"
    },
    {
      id: "player-profile",
      name: "👤 Player Profile",
      description: "Test player profile data scraping (ranking, stats)",
      category: "Player"
    }
  ];

  const allTests = [
    ...tests,
    {
      id: "run-all-tests",
      name: "🚀 Run All Tests",
      description: "Run all scraper tests sequentially (single scrape, all validations)",
      category: "All"
    }
  ];

  const groupedTests = tests.reduce((acc, test) => {
    if (!acc[test.category]) acc[test.category] = [];
    acc[test.category].push(test);
    return acc;
  }, {} as Record<string, typeof tests>);

  const renderValidationResults = (validation: any) => {
    if (!validation || !validation.checks || !Array.isArray(validation.checks)) return null;
    
    return (
      <div className="mt-4 space-y-3">
        <h4 className="text-sm font-medium text-secondary-foreground">Field Validation:</h4>
        <div className="space-y-2">
          {validation.checks.map((check: any, index: number) => (
            <div key={index} className="flex items-start gap-3 text-sm p-2 bg-muted rounded">
              <span className={check.valid ? "text-chart-1" : "text-destructive"}>
                {check.valid ? "✅" : "❌"}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-muted-foreground font-medium">{check.field}:</span>
                  <span className="text-secondary-foreground text-xs">{check.expected}</span>
                </div>
                {check.actual !== undefined && (
                  <div className={`font-mono text-xs mt-1 truncate ${check.valid ? "text-chart-1" : "text-destructive"}`}>
                    {typeof check.actual === 'object' ? JSON.stringify(check.actual) : String(check.actual)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="pt-2 border-t border-border">
          <span className={`text-sm font-medium ${validation.isValid ? "text-chart-1" : "text-destructive"}`}>
            Overall: {validation.isValid ? "VALID" : "INVALID"}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">🧪 Scraper Test Suite</h1>
          <p className="text-muted-foreground">Validate all scraping components with comprehensive field-by-field testing</p>
        </div>
        
        {/* Debug Info */}
        {(testData || testError || isRunning) && (
          <div className="mb-6 p-4 bg-muted rounded-lg border border-border">
            <div className="flex items-center gap-4 text-sm">
              <span className="text-muted-foreground">Status:</span>
              {isRunning && <span className="text-chart-4 font-medium">🔄 Running...</span>}
              {testData && <span className="text-chart-1 font-medium">✅ Success</span>}
              {testError && <span className="text-destructive font-medium">❌ Error: {testError}</span>}
            </div>
          </div>
        )}

        {/* Main Action */}
        <div className="mb-8">
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-card-foreground mb-2">Comprehensive Scraper Validation</h2>
              <p className="text-muted-foreground">
                {isRunning && startTime 
                  ? `Running since ${startTime.toLocaleTimeString()}... Please wait, scraping in progress.` 
                  : "Tests ALL scraper components using just ONE entity of each type for efficient validation"
                }
              </p>
            </div>
            
            <button
              onClick={() => runTest("run-all-tests")}
              disabled={isRunning}
              className={`px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-200 ${
                isRunning 
                  ? "bg-muted text-muted-foreground cursor-not-allowed animate-pulse" 
                  : "bg-primary text-primary-foreground hover:opacity-90 hover:scale-105 shadow-lg"
              }`}
            >
              {isRunning ? "🔄 Scraping TennisExplorer..." : "🚀 Run All Tests"}
            </button>
            
            {/* Progress indicator */}
            {isRunning && (
              <div className="mt-6 max-w-md mx-auto">
                <div className="bg-secondary border border-border rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-chart-4 rounded-full animate-ping"></div>
                    <div className="text-left">
                      <p className="text-secondary-foreground font-medium text-sm">Live Scraping Progress</p>
                      <p className="text-muted-foreground text-xs">Initializing Puppeteer cluster and scraping TennisExplorer...</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Individual Tests */}
        <div className="mb-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-foreground mb-2">Individual Component Tests</h2>
            <p className="text-muted-foreground text-sm">Test specific scraping components individually</p>
          </div>
          
          {Object.entries(groupedTests).map(([category, categoryTests]) => (
            <div key={category} className="mb-6">
              <h3 className="text-lg font-medium text-card-foreground mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-chart-1 rounded-full"></span>
                {category} Tests
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {categoryTests.map((test) => (
                  <div key={test.id} className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex flex-col gap-3">
                      <div className="flex-1">
                        <h4 className="font-medium text-card-foreground">{test.name}</h4>
                        <p className="text-muted-foreground text-sm mt-1">{test.description}</p>
                      </div>
                      <button
                        onClick={() => runTest(test.id)}
                        disabled={isRunning}
                        className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                          isRunning 
                            ? "bg-muted text-muted-foreground cursor-not-allowed" 
                            : "bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground"
                        }`}
                      >
                        {isRunning ? "Running..." : "Run Test"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Results Section */}
        {testData && (
          <div ref={resultsRef} className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-card-foreground">📊 Test Results</h2>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                  testData.success 
                    ? "bg-chart-1 text-white" 
                    : "bg-destructive text-white"
                }`}>
                  {testData.success ? "✅ Success" : "❌ Error"}
                </span>
                {testData.testType && (
                  <span className="px-2 py-1 bg-muted text-muted-foreground rounded text-xs font-medium">
                    {testData.testType}
                  </span>
                )}
              </div>
            </div>

            {/* Enhanced Validation Results */}
            {testData.testType === "run-all-tests" && testData.data?.testResults ? (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-card-foreground">All Tests Results:</h3>
                <div className="grid gap-4">
                  {testData.data.testResults.map((testResult: any, index: number) => (
                    <div key={index} className="bg-secondary border border-border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className={testResult.success ? "text-chart-1" : "text-destructive"}>
                            {testResult.success ? "✅" : "❌"}
                          </span>
                          <h4 className="font-medium text-secondary-foreground">{testResult.testType.replace(/-/g, ' ').toUpperCase()}</h4>
                        </div>
                        <span className={`px-3 py-1 rounded text-xs font-medium ${
                          testResult.success ? "bg-chart-1 text-white" : "bg-destructive text-white"
                        }`}>
                          {testResult.success ? "PASS" : "FAIL"}
                        </span>
                      </div>
                      {testResult.validation && renderValidationResults(testResult.validation)}
                      {testResult.error && (
                        <p className="text-destructive text-sm mt-3 p-2 bg-muted rounded">Error: {testResult.error}</p>
                      )}
                      {testResult.note && (
                        <p className="text-chart-4 text-sm mt-3 p-2 bg-muted rounded">Note: {testResult.note}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              testData.data?.validation && renderValidationResults(testData.data.validation)
            )}
            
            {/* Scraped URLs */}
            {testData.data?.scrapedUrls && testData.data.scrapedUrls.length > 0 && (
              <div className="mt-6 p-4 bg-secondary border border-border rounded-lg">
                <h3 className="text-sm font-medium text-secondary-foreground mb-3">Scraped URLs:</h3>
                <div className="space-y-2">
                  {testData.data.scrapedUrls.map((url: string, index: number) => (
                    <div key={index} className="bg-muted p-2 rounded text-xs font-mono break-all">
                      <a 
                        href={url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-chart-1 hover:underline"
                      >
                        {url}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Summary Information */}
            {testData.data?.summary && (
              <div className="mt-6 p-4 bg-secondary border border-border rounded-lg">
                <h3 className="text-sm font-medium text-secondary-foreground mb-3">Summary:</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  {Object.entries(testData.data.summary).map(([key, value]) => (
                    <div key={key} className="bg-muted p-3 rounded">
                      <div className="text-muted-foreground text-xs capitalize mb-1">
                        {key.replace(/([A-Z])/g, ' $1')}
                      </div>
                      <div className="text-card-foreground font-mono font-medium">
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Raw JSON (Collapsible) */}
            <details className="mt-6">
              <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors">
                Show Raw JSON Data
              </summary>
              <div className="bg-muted p-4 rounded-lg text-xs overflow-auto max-h-96 border border-border mt-3">
                <pre className="text-muted-foreground">{JSON.stringify(testData, null, 2)}</pre>
              </div>
            </details>
          </div>
        )}

        {/* Quick Commands */}
        <div className="mt-8 bg-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold text-card-foreground mb-4">🛠️ API Commands</h2>
          <p className="text-muted-foreground text-sm mb-4">Test endpoints directly via curl commands</p>
          <div className="space-y-3">
            {allTests.map((test) => (
              <div key={test.id} className="bg-muted rounded-lg p-3">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-card-foreground mb-1">{test.name}</div>
                    <code className="bg-secondary text-secondary-foreground px-3 py-1.5 rounded text-xs break-all block">
                      {`curl -X POST http://localhost:5173/api/test-scraper -d 'testType=${test.id}'`}
                    </code>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}