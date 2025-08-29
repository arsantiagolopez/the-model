import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { db, players, matches } from "~/lib/db";
import { eq, or, desc } from "drizzle-orm";
import { getPlayerImageUrl } from "~/utils/model/getPlayerImageUrl";
import countryCodes from "~/data/model/countries.json";
import { Avatar } from "~/components/ModelContent/Avatar";
import { FormGraph } from "~/components/ModelContent/FormGraph";
import { SurfaceRecords } from "~/components/ModelContent/SurfaceRecords";
import { RightSection } from "~/components/ModelContent/PlayerTemplate/RightSection";
import { LastMatchesDetailed } from "~/components/ModelContent/PlayerTemplate/RightSection/LastMatchesDetailed/index";

export async function loader({ params }: LoaderFunctionArgs) {
  const { playerId } = params;
  console.log("🏃‍♂️ Loading player:", playerId);

  if (!playerId) {
    throw new Response("Player ID required", { status: 400 });
  }

  try {
    // Try different playerId formats
    const formattedPlayerId = `/player/${playerId}/`;

    let player = await db
      .select()
      .from(players)
      .where(eq(players.playerId, formattedPlayerId))
      .limit(1)
      .then((results) => results[0]);

    if (!player) {
      player = await db
        .select()
        .from(players)
        .where(eq(players.playerId, playerId))
        .limit(1)
        .then((results) => results[0]);
    }

    if (!player) {
      throw new Response("Player not found", { status: 404 });
    }

    console.log("Found player:", player.name);

    // Get recent matches for this player
    console.log(
      "Searching for matches with homeLink or awayLink:",
      player.playerId
    );

    // Try all possible playerId formats at once
    const altPlayerId1 = player.playerId.replace("/player/", "").replace(/\/$/, "");
    const altPlayerId2 = `/player/${altPlayerId1}/`;
    const altPlayerId3 = `${altPlayerId1}`;
    const altPlayerId4 = `/player/${altPlayerId1}`;
    
    console.log("Trying all player ID formats:", {
      original: player.playerId,
      alt1: altPlayerId1,
      alt2: altPlayerId2, 
      alt3: altPlayerId3,
      alt4: altPlayerId4
    });

    const recentMatches = await db
      .select()
      .from(matches)
      .where(
        or(
          eq(matches.homeLink, player.playerId),
          eq(matches.awayLink, player.playerId),
          eq(matches.homeLink, altPlayerId1),
          eq(matches.awayLink, altPlayerId1),
          eq(matches.homeLink, altPlayerId2),
          eq(matches.awayLink, altPlayerId2),
          eq(matches.homeLink, altPlayerId3),
          eq(matches.awayLink, altPlayerId3),
          eq(matches.homeLink, altPlayerId4),
          eq(matches.awayLink, altPlayerId4)
        )
      )
      .orderBy(desc(matches.date))
      .limit(50);
      
    console.log(`Initial query found ${recentMatches.length} matches`);
    
    // Check what homeLink/awayLink values actually exist in the database
    const allTiafoeMatches = await db
      .select({
        homeLink: matches.homeLink,
        awayLink: matches.awayLink,
        home: matches.home,
        away: matches.away,
        matchId: matches.matchId
      })
      .from(matches)
      .where(
        or(
          eq(matches.home, "Tiafoe Frances"),
          eq(matches.away, "Tiafoe Frances"),
          eq(matches.home, "Tiafoe F."),
          eq(matches.away, "Tiafoe F.")
        )
      )
      .limit(25);
    
    console.log(`🔍 Found ${allTiafoeMatches.length} matches with Tiafoe name variations:`);
    allTiafoeMatches.forEach((m, i) => {
      console.log(`  ${i+1}. home: "${m.home}" (link: ${m.homeLink}) | away: "${m.away}" (link: ${m.awayLink})`);
    });
    console.log("First 3 matches from DB:", recentMatches.slice(0, 3).map(m => ({
      id: m.id,
      home: m.home,
      away: m.away,
      homeLink: m.homeLink,
      awayLink: m.awayLink,
      matchId: m.matchId
    })));
    
    // If still limited results, try searching by player name variations
    if (recentMatches.length < 10) {
      console.log("Searching by player name patterns...");
      
      // Try different name formats
      const playerLastName = player.name.split(' ')[0]; // "Tiafoe"  
      const playerFirstInitial = player.name.split(' ')[1]?.charAt(0) || 'X';
      const playerShortName = `${playerLastName} ${playerFirstInitial}.`; // "Tiafoe F."
      const playerFullName = player.name; // "Tiafoe Frances"
      
      console.log("Trying name formats:", { playerLastName, playerShortName, playerFullName });
      
      const nameMatches = await db
        .select()  
        .from(matches)
        .where(
          or(
            eq(matches.home, playerFullName),
            eq(matches.away, playerFullName),
            eq(matches.home, playerShortName),
            eq(matches.away, playerShortName)
          )
        )
        .orderBy(desc(matches.date))
        .limit(50);
        
      console.log(`Name search found ${nameMatches.length} additional matches`);
      
      // Merge results
      nameMatches.forEach((match) => {
        if (!recentMatches.find((existing) => existing.id === match.id)) {
          recentMatches.push(match);
        }
      });
    }

    console.log(
      `Found ${recentMatches.length} recent matches for ${player.name}`
    );
    console.log("Recent matches raw data:", recentMatches.slice(0, 3)); // Show first 3 matches

    // Get records directly from player data (stored as JSONB)
    const playerRecords = player.record || {};
    console.log("Player records from database:", playerRecords);

    // Create profile object from player data
    const playerProfile = {
      name: player.name,
      image: player.image,
      country: player.country,
      height: undefined, // not in current schema
      age: player.age,
      birthday: player.birthday,
      singlesRank: player.singlesRank,
      sex: player.sex,
      hand: player.hand,
    };
    console.log("Player profile from database:", playerProfile);

    // Get country flag
    const countryCode =
      player.country &&
      countryCodes
        .find(
          ({ name }) =>
            player.country &&
            name.toLowerCase().includes(player.country.toLowerCase())
        )
        ?.code.toLowerCase();
    const flag = countryCode
      ? `${import.meta.env.VITE_SCRAPING_FLAGS_URL}${countryCode}.png`
      : undefined;

    return {
      playerId: player.playerId,
      name: player.name,
      country: player.country,
      singlesRank: player.singlesRank,
      age: player.age,
      image: player.image,
      flag: flag,
      records: playerRecords,
      profile: playerProfile,
      lastMatches: recentMatches.map((match) => ({
        id: match.id.toString(), // Convert to string to match MatchEntity interface
        matchId: match.matchId,
        tournament: match.tournament,
        tournamentLink: match.tournamentLink,
        tournamentId: match.tournamentId,
        home: match.home,
        away: match.away,
        homeLink: match.homeLink || "",
        awayLink: match.awayLink || "",
        homeOdds: Number(match.homeOdds),
        awayOdds: Number(match.awayOdds),
        homeH2h: match.homeH2h ?? undefined,
        awayH2h: match.awayH2h ?? undefined,
        surface: match.surface ?? undefined,
        round: match.round ?? undefined,
        year: match.year ?? undefined,
        type: match.type ?? undefined,
        matchLink: match.matchLink,
        // Date is stored as JSONB, could be string, Date, or object
        date: match.date
          ? typeof match.date === "string"
            ? match.date
            : match.date instanceof Date
              ? match.date.toISOString()
              : typeof match.date === "object" && match.date !== null
                ? (match.date as any).date &&
                  typeof (match.date as any).date === "string"
                  ? (match.date as any).date
                  : JSON.stringify(match.date)
                : new Date().toISOString()
          : new Date().toISOString(),
        result: match.result
          ? {
              winner: (match.result as any).winner,
              homeSets: (match.result as any).homeSets,
              awaySets: (match.result as any).awaySets,
            }
          : undefined,
        odds: match.odds as any,
        headToHeadMatches: match.headToHeadMatches as any,
      })),
    };
  } catch (error) {
    console.error("Error:", error);
    if (error instanceof Response) throw error;
    throw new Response("Server error", { status: 500 });
  }
}

export default function PlayerDetailPage() {
  const data = useLoaderData<typeof loader>();

  const { profile, lastMatches, record } = {
    profile: data.profile,
    lastMatches: data.lastMatches,
    record: data.records,
  };

  let { name, image, country, age, hand, height, singlesRank } = profile || {};

  // Get country's flag
  const countryCode =
    country &&
    countryCodes
      .find(
        ({ name }) =>
          country && name.toLowerCase().includes(country.toLowerCase())
      )
      ?.code.toLowerCase();
  const flag = countryCode
    ? `${import.meta.env.VITE_SCRAPING_FLAGS_URL}${countryCode}.png`
    : undefined;

  console.log("Flag debug:", { country, countryCode, flag });

  // Camelcase hand & country fields
  hand = hand && hand.charAt(0).toUpperCase() + hand.slice(1, hand.length);
  country =
    country &&
    country.charAt(0).toUpperCase() + country.slice(1, country.length);

  const avatarProps = { image: getPlayerImageUrl(image), width: "3.5rem" };
  const flagAvatarProps = { image: flag };
  const nationalityAvatarProps = { image: flag, width: "0.75rem" };

  console.log("Avatar props:", { flagAvatarProps, nationalityAvatarProps });

  const formGraphProps = {
    lastMatches,
    graphHeight: "h-[40vh] md:h-[30vh]",
  };
  const surfaceRecordsProps = {
    allSurfaces: true,
    currentSurface: undefined, // upcomingMatch?.surface,
    record: {
      playerId: data.playerId,
      records: record,
      ...record, // Spread the record data for compatibility
    },
  };

  // Create player entity object for RightSection
  const playerEntity = {
    playerId: data.playerId,
    profile: {
      image: data.image,
      name: data.name,
      country: data.country,
      ranking: data.singlesRank,
    },
    lastMatches: lastMatches,
    upcomingMatch: undefined,
    record: data.records,
  };

  const lastMatchesDetailedProps = { player: name, lastMatches };

  return (
    <div className="min-h-screen bg-primary text-white">
      <div className="flex flex-col md:flex-row w-full h-full">
        {/* Left Section - Player Info */}
        <div className="flex flex-col w-full md:w-1/2 h-full px-5 py-2">
          {/* Go back */}
          <div className="flex flex-row items-center pb-6">
            {/* Back button */}
            <button
              onClick={() => window.history.back()}
              className="rounded-full px-2 -ml-3 mr-1 hover:py-2 h-10 hover:bg-secondary"
            >
              ←
            </button>

            {/* Avatar & Name */}
            <div className="flex flex-col w-full max-w-[90%] text-white ml-1 mr-2">
              <div className="flex flex-row items-center mt-2">
                {/* Headshot and country flag */}
                <div className="relative">
                  <div className="mr-2 md:mr-4">
                    <Avatar {...avatarProps} />
                  </div>
                  {flag && (
                    <div className="absolute -bottom-1.5 -right-1.5 md:bottom-0 md:right-0 w-4 h-4 mx-2 md:mx-3 rounded-full aspect-square">
                      <Avatar {...flagAvatarProps} />
                    </div>
                  )}
                </div>

                {/* Name */}
                <h1 className="text-3xl text-white font-[800] tracking-tight truncate">
                  {name}
                </h1>
              </div>
            </div>
          </div>

          {/* Profile */}
          <div className="flex flex-col gap-2 text-sm text-white py-3 md:py-6 w-full px-4">
            {/* Rank & Nationality */}
            <div className="flex flex-row w-full md:w-[70%]">
              {singlesRank ? (
                <p className="font-bold w-full">
                  {singlesRank}{" "}
                  <span className="text-[0.6rem] font-[800] text-fourth">
                    RANK{" "}
                  </span>
                  🏆
                </p>
              ) : null}

              {country && (
                <div className="flex flex-row justify-end md:justify-start items-baseline w-full">
                  <span className="truncate">{country}</span>

                  <span className="text-[0.6rem] mx-1 text-fourth font-[800]">
                    NATIONALITY
                  </span>
                  <Avatar {...nationalityAvatarProps} />
                </div>
              )}
            </div>

            {/* Age & Hand */}
            <div className="flex flex-row w-full md:w-[70%]">
              {age ? (
                <p className="font-bold w-full">
                  {age}{" "}
                  <span className="text-[0.6rem] font-[800] text-fourth">
                    YRS{" "}
                  </span>
                  🎂
                </p>
              ) : null}

              {hand && (
                <p className="flex justify-end md:justify-start w-full truncate">
                  {hand}-Handed
                  <span className="text-[0.6rem] font-[800] text-fourth mx-1">
                    PLAYS
                  </span>
                  👋
                </p>
              )}
            </div>

            {/* Height */}
            <div className="flex flex-row w-full md:w-[70%]">
              {height && (
                <p className="font-bold self-center">
                  {height}{" "}
                  <span className="text-[0.6rem] font-[800] text-fourth">
                    TALL
                  </span>{" "}
                  📏
                </p>
              )}
            </div>
          </div>

          {/* Form graph */}
          <div className="my-4">
            <h1 className="font-[800] tracking-tight text-xl md:text-2xl mb-4 text-white">
              Recent Form
            </h1>
            <div className="w-full p-6 rounded-md bg-secondary">
              <FormGraph isDetailed {...formGraphProps} />
            </div>
          </div>

          {/* Overall record */}
          <div className="my-4">
            <h1 className="font-[800] tracking-tight text-xl md:text-2xl mb-4 text-white">
              Records
            </h1>
            <div className="w-full rounded-md bg-secondary p-2 py-4 md:py-5 md:px-4 text-fourth text-xs md:mb-10">
              <SurfaceRecords {...surfaceRecordsProps} />
            </div>
          </div>

          {/* Mobile only matches */}
          <div className="md:hidden my-4">
            <h1 className="font-[800] tracking-tight text-xl md:text-2xl mb-4 text-white">
              Last Matches
            </h1>
            <LastMatchesDetailed {...lastMatchesDetailedProps} />
          </div>
        </div>

        {/* Right Section - Last Matches (Desktop Only) */}
        <div className="hidden md:flex md:w-1/2 h-full">
          <RightSection player={playerEntity} />
        </div>
      </div>
    </div>
  );
}

export function ErrorBoundary() {
  return (
    <div className="min-h-screen bg-red-500 flex items-center justify-center">
      <div className="text-center text-white">
        <h1 className="text-4xl font-bold mb-4">Error</h1>
        <p className="text-xl mb-8">Something went wrong loading this player</p>
        <a
          href="/model"
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-opacity-80"
        >
          Back to Model
        </a>
      </div>
    </div>
  );
}
