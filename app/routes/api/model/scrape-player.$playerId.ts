import type { LoaderFunctionArgs } from "react-router";
import { db, players, matches } from "~/lib/db";
import { eq } from "drizzle-orm";
import { ScrapingClient } from "~/lib/scraping/scraping-client";
import { PlayerScraper } from "~/lib/scraping/scrapers/player-scraper";

export async function loader({ params }: LoaderFunctionArgs) {
  const { playerId } = params;
  
  if (!playerId) {
    throw new Response("Player ID required", { status: 400 });
  }

  const fullPlayerId = `/player/${playerId}/`;
  
  try {
    console.log(`🕷️ Scraping player: ${fullPlayerId}`);
    
    // Check if player exists in database
    const [existingPlayer] = await db.select().from(players)
      .where(eq(players.playerId, fullPlayerId))
      .limit(1);
    
    if (!existingPlayer) {
      return Response.json({ 
        success: false, 
        error: "Player not found in database" 
      });
    }

    // Create scraping client and PlayerScraper
    const client = new ScrapingClient();
    const playerScraper = new PlayerScraper(client);
    
    console.log(`🌐 Scraping player with PlayerScraper: ${fullPlayerId}`);
    
    // Use PlayerScraper to get enhanced player data including matches
    const enhancedPlayers = await playerScraper.enhancePlayers([existingPlayer]);
    
    if (enhancedPlayers.length === 0) {
      return Response.json({ 
        success: false, 
        error: "Failed to scrape player data" 
      });
    }

    const enhancedPlayer = enhancedPlayers[0];

    // Update the player in the database
    const updatedPlayer = await db.update(players)
      .set({
        name: enhancedPlayer.name || existingPlayer.name,
        image: enhancedPlayer.image || existingPlayer.image,
        country: enhancedPlayer.country || existingPlayer.country,
        age: enhancedPlayer.age || existingPlayer.age,
        birthday: enhancedPlayer.birthday || existingPlayer.birthday,
        singlesRank: enhancedPlayer.singlesRank || existingPlayer.singlesRank,
        sex: enhancedPlayer.sex || existingPlayer.sex,
        hand: enhancedPlayer.hand || existingPlayer.hand,
        record: enhancedPlayer.record || existingPlayer.record,
        form: enhancedPlayer.form || existingPlayer.form,
        streak: enhancedPlayer.streak || existingPlayer.streak,
        injuries: enhancedPlayer.injuries || existingPlayer.injuries,
        pastTournamentResults: enhancedPlayer.pastTournamentResults || existingPlayer.pastTournamentResults,
        upcomingMatch: enhancedPlayer.upcomingMatch || existingPlayer.upcomingMatch,
        updatedAt: new Date(),
      })
      .where(eq(players.playerId, fullPlayerId))
      .returning();

    // Store the scraped matches in the matches table
    console.log('🔍 Checking lastMatches:', {
      exists: !!enhancedPlayer.lastMatches,
      isArray: Array.isArray(enhancedPlayer.lastMatches),
      length: enhancedPlayer.lastMatches?.length
    });
    
    if (enhancedPlayer.lastMatches && Array.isArray(enhancedPlayer.lastMatches)) {
      console.log(`💾 Storing ${enhancedPlayer.lastMatches.length} matches for player`);
      
      for (const matchData of enhancedPlayer.lastMatches) {
        try {
          // Create a unique match ID if not provided
          const cleanMatchId = `player-${playerId}-${matchData.date}-${matchData.opponent}-${matchData.tournament}`.replace(/[^\w-]/g, '');
          
          // Parse date properly - format is "27.08." (day.month.)
          let parsedDate = new Date();
          try {
            const dateParts = matchData.date.match(/(\d+)\.(\d+)\./);
            if (dateParts) {
              const day = parseInt(dateParts[1]);
              const month = parseInt(dateParts[2]) - 1; // Month is 0-indexed
              const year = new Date().getFullYear(); // Use current year
              parsedDate = new Date(year, month, day);
            }
          } catch (e) {
            console.log("Date parsing failed, using current date");
          }
          
          const homeLink = matchData.result === 'W' ? fullPlayerId : `/player/${matchData.opponent.toLowerCase().replace(/\s+/g, '').replace(/\./g, '')}/`;
          const awayLink = matchData.result === 'W' ? `/player/${matchData.opponent.toLowerCase().replace(/\s+/g, '').replace(/\./g, '')}/` : fullPlayerId;
          
          console.log(`📝 STORING: ${matchData.opponent} (${matchData.result}) -> home: ${matchData.result === 'W' ? existingPlayer.name : matchData.opponent}, homeLink: ${homeLink}`);
          
          await db.insert(matches).values({
            matchId: cleanMatchId,
            tournament: matchData.tournament?.trim() || 'Unknown',
            tournamentId: matchData.tournamentLink?.replace(/\//g, '').replace(/-/g, '') || cleanMatchId,
            tournamentLink: matchData.tournamentLink || '',
            home: matchData.result === 'W' ? existingPlayer.name : matchData.opponent,
            away: matchData.result === 'W' ? matchData.opponent : existingPlayer.name,
            homeLink,
            awayLink,
            homeOdds: matchData.result === 'W' ? (matchData.homeOdds || 0) : (matchData.awayOdds || 0),
            awayOdds: matchData.result === 'W' ? (matchData.awayOdds || 0) : (matchData.homeOdds || 0),
            surface: matchData.surface || 'hard',
            round: matchData.round || 'Unknown',
            date: parsedDate,
            year: parsedDate.getFullYear(),
            type: enhancedPlayer.sex === 'women' ? 'WTA' : 'ATP',
            matchLink: matchData.matchLink,
            result: {
              winner: matchData.result === 'W' ? existingPlayer.name : matchData.opponent,
              homeSets: 0, // Will need proper score parsing
              awaySets: 0,
            },
            createdAt: new Date(),
            updatedAt: new Date(),
          }).onConflictDoUpdate({
            target: [matches.matchId],
            set: {
              homeOdds: matchData.result === 'W' ? (matchData.homeOdds || 0) : (matchData.awayOdds || 0),
              awayOdds: matchData.result === 'W' ? (matchData.awayOdds || 0) : (matchData.homeOdds || 0),
              updatedAt: new Date()
            }
          });
          
        } catch (matchError) {
          console.error("❌ Error storing match:", {
            opponent: matchData.opponent,
            result: matchData.result,
            home: matchData.result === 'W' ? existingPlayer.name : matchData.opponent,
            away: matchData.result === 'W' ? matchData.opponent : existingPlayer.name,
            homeLink: matchData.result === 'W' ? fullPlayerId : `/player/${matchData.opponent.toLowerCase().replace(/\s+/g, '').replace(/\./g, '')}/`,
            awayLink: matchData.result === 'W' ? `/player/${matchData.opponent.toLowerCase().replace(/\s+/g, '').replace(/\./g, '')}/` : fullPlayerId,
            error: matchError
          });
        }
      }
    }

    console.log(`✅ Updated player: ${enhancedPlayer.name}`);

    return Response.json({
      success: true,
      player: updatedPlayer[0],
      scrapedData: enhancedPlayer,
      matchesStored: enhancedPlayer.lastMatches?.length || 0
    });

  } catch (error) {
    console.error("Error scraping player:", error);
    return Response.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    });
  }
}