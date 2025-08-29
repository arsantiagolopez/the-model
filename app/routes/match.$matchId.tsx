import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { useLoaderData, useNavigate } from "react-router";
import { ActiveMatchPanel } from "~/components/ModelContent/ActiveMatchPanel";

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data?.match) {
    return [
      { title: "Match Not Found" },
      { name: "description", content: "The requested match could not be found." },
    ];
  }

  const { home, away, tournament } = data.match;
  return [
    { title: `${home} vs ${away} - ${tournament}` },
    { name: "description", content: `Tennis match between ${home} and ${away} in ${tournament}` },
  ];
};

export async function loader({ params }: LoaderFunctionArgs) {
  const { matchId } = params;
  
  if (!matchId) {
    throw new Response("Match ID required", { status: 400 });
  }

  // For now, we'll pass the matchId to the component
  // The ActiveMatchPanel will handle fetching the match data
  return { matchId };
}

export default function MatchPage() {
  const { matchId } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  const resetActiveIds = () => {
    navigate(-1); // Go back to previous page
  };

  const activeMatchPanelProps = {
    activeMatchId: matchId,
    resetActiveIds,
    toggleOdds: () => {}, // TODO: implement proper odds toggle
    oddsFormat: 'american' as 'american' | 'decimal',
    isParlayActive: false,
    setIsParlayActive: () => {},
    parlayLegs: undefined,
    setParlayLegs: () => {},
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      
      <ActiveMatchPanel {...activeMatchPanelProps} />
    </div>
  );
}