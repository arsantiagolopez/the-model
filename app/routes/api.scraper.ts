import type { LoaderFunctionArgs } from 'react-router';
import { ClusterScraperOrchestrator } from '../scraper/cluster-scraper-orchestrator';

export async function action({ request }: LoaderFunctionArgs) {
  const formData = await request.formData();
  const action = formData.get('action');

  try {
    const scraper = new ClusterScraperOrchestrator();

    switch (action) {
      case 'test-single': {
        console.log('🚀 Starting single match test...');
        const startTime = Date.now();
        
        const result = await scraper.testSingleMatch();
        const duration = Date.now() - startTime;
        
        console.log(`✅ Single test completed in ${duration}ms`);
        
        return Response.json({ 
          success: true, 
          result,
          duration,
          message: `Single match test completed in ${(duration/1000).toFixed(1)}s`
        });
      }

      case 'test-batch': {
        const matchCount = parseInt(formData.get('matchCount') as string) || 100;
        const tournamentCount = parseInt(formData.get('tournamentCount') as string) || 5;
        
        console.log(`🚀 Starting batch test: ${matchCount} matches, ${tournamentCount} tournaments...`);
        const startTime = Date.now();
        
        const result = await scraper.testBatch(matchCount, tournamentCount);
        const filename = await scraper.saveBatchResults(result, matchCount, tournamentCount);
        
        const duration = Date.now() - startTime;
        const rate = (result.matches.length + result.players.length) / (duration / 1000);
        
        console.log(`✅ Batch test completed in ${duration}ms (${rate.toFixed(1)} items/sec)`);
        
        return Response.json({ 
          success: true, 
          result: {
            matches: result.matches.length,
            players: result.players.length,
            tournaments: result.tournaments.length,
            filename,
            duration,
            rate: rate.toFixed(1) + ' items/sec'
          },
          message: `Batch test completed: ${result.matches.length} matches, ${result.players.length} players in ${(duration/1000).toFixed(1)}s`
        });
      }

      case 'production-run': {
        const matchCount = parseInt(formData.get('matchCount') as string) || 500;
        const tournamentCount = parseInt(formData.get('tournamentCount') as string) || 10;
        
        console.log(`🚀 Starting PRODUCTION run: ${matchCount} matches, ${tournamentCount} tournaments...`);
        const startTime = Date.now();
        
        const result = await scraper.testBatch(matchCount, tournamentCount);
        const filename = await scraper.saveBatchResults(result, matchCount, tournamentCount);
        
        const duration = Date.now() - startTime;
        const rate = (result.matches.length + result.players.length) / (duration / 1000);
        
        // Create production-ready filename
        const prodFilename = filename.replace('cluster-', 'production-cluster-');
        
        console.log(`✅ PRODUCTION run completed in ${duration}ms (${rate.toFixed(1)} items/sec)`);
        
        return Response.json({ 
          success: true, 
          result: {
            matches: result.matches.length,
            players: result.players.length,
            tournaments: result.tournaments.length,
            filename: prodFilename,
            duration,
            rate: rate.toFixed(1) + ' items/sec',
            estimatedSpeedup: 'Puppeteer cluster architecture'
          },
          message: `PRODUCTION run completed: ${result.matches.length} matches, ${result.players.length} players in ${(duration/1000).toFixed(1)}s - ${rate.toFixed(1)} items/sec!`
        });
      }

      default:
        return Response.json({ 
          success: false, 
          error: 'Invalid action. Use: test-single, test-batch, or production-run' 
        });
    }
  } catch (error) {
    console.error('Cluster scraper error:', error);
    return Response.json({ 
      success: false, 
      error: (error as Error).message 
    });
  }
}