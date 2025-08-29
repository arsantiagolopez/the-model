import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Play, Loader2, CheckCircle, XCircle } from "lucide-react";

type ScrapeStatus = "idle" | "running" | "success" | "error";

export function ModelScrapeButton() {
  const [status, setStatus] = useState<ScrapeStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const handleStartScrape = async () => {
    setStatus("running");
    setError(null);

    try {
      // Start the scraping process without waiting for completion
      // The logs viewer will show the progress
      fetch("/api/model/scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      }).then(async (response) => {
        try {
          const result = await response.json();
          
          if (result.success) {
            setStatus("success");
            console.log("✅ Scraping completed:", result.stats);
            
            // Reset to idle after 5 seconds
            setTimeout(() => {
              setStatus("idle");
            }, 5000);
          } else {
            setStatus("error");
            setError(result.error || "Unknown error occurred");
            
            // Reset to idle after 5 seconds
            setTimeout(() => {
              setStatus("idle");
              setError(null);
            }, 5000);
          }
        } catch (parseError) {
          setStatus("error");
          setError("Failed to parse response");
          setTimeout(() => {
            setStatus("idle");
            setError(null);
          }, 5000);
        }
      }).catch((fetchError) => {
        setStatus("error");
        setError(fetchError instanceof Error ? fetchError.message : "Network error");
        setTimeout(() => {
          setStatus("idle");
          setError(null);
        }, 5000);
      });

      // Set status to running immediately, don't wait for completion
      console.log("🚀 Starting scraping process... Check logs below for progress.");
      
      // Reset to idle after 10 minutes (max expected time)
      setTimeout(() => {
        if (status === "running") {
          setStatus("idle");
        }
      }, 10 * 60 * 1000);
      
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Immediate error occurred");
      
      // Reset to idle after 5 seconds
      setTimeout(() => {
        setStatus("idle");
        setError(null);
      }, 5000);
    }
  };

  const getButtonContent = () => {
    switch (status) {
      case "running":
        return (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Scraping...
          </>
        );
      case "success":
        return (
          <>
            <CheckCircle className="h-4 w-4 mr-2" />
            Complete
          </>
        );
      case "error":
        return (
          <>
            <XCircle className="h-4 w-4 mr-2" />
            Failed
          </>
        );
      default:
        return (
          <>
            <Play className="h-4 w-4 mr-2" />
            Start Model
          </>
        );
    }
  };

  const getButtonVariant = () => {
    switch (status) {
      case "success":
        return "default" as const;
      case "error":
        return "destructive" as const;
      case "running":
        return "secondary" as const;
      default:
        return "default" as const;
    }
  };

  return (
    <div className="flex flex-col items-end">
      <Button
        onClick={handleStartScrape}
        disabled={status === "running"}
        variant={getButtonVariant()}
        size="lg"
        className="min-w-[150px]"
      >
        {getButtonContent()}
      </Button>
      {error && (
        <p className="text-sm text-destructive mt-1 max-w-[150px] text-right">
          {error}
        </p>
      )}
    </div>
  );
}