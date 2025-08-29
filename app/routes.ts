import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  // Business logic routes
  index("routes/_index.tsx"),
  route("home", "routes/home.tsx"),
  route("model", "routes/model.tsx"),
  route("model/:playerId", "routes/model.$playerId.tsx"),
  route("match/:matchId", "routes/match.$matchId.tsx"),
  route("player/:playerId", "routes/player.$playerId.tsx"),
  route("model-simple", "routes/model-simple.tsx"),
  route("model-test", "routes/model-test.tsx"),
  route("test-scraper", "routes/test-scraper.tsx"),
  route("admin", "routes/admin.tsx"),
  route("login/*", "routes/login.tsx"),
  route("register/*", "routes/register.tsx"),

  // API routes
  route("api/test-scraper", "routes/api/test-scraper.ts"),
  route("api/model/scrape", "routes/api/model/scrape.ts"),
  route("api/model/scrape-player/:playerId", "routes/api/model/scrape-player.$playerId.ts"),
  route("api/logs/stream", "routes/api/logs/stream.ts"),
  route("api/logs/test", "routes/api/logs/test.ts"),
  route("api/model/matches/:matchId", "routes/api.model.matches.$matchId.ts"),
  route("api/model/players/:playerId", "routes/api.model.players.$playerId.ts"),
  route("api/model/players/profile/:playerId", "routes/api.model.players.profile.$playerId.ts"),
  route("api/model/players/records/:playerId", "routes/api.model.players.records.$playerId.ts"),
  route("api/model/stats/surface", "routes/api/model/stats/surface.ts"),
  route("api/model/stats/rust", "routes/api/model/stats/rust.ts"),
  route("api/model/stats/form", "routes/api/model/stats/form.ts"),
  route("api/model/stats/country", "routes/api.model.stats.country.ts"),
  route("api/model/stats/streak", "routes/api.model.stats.streak.ts"),
  route("api/debug/site-check", "routes/api/debug/site-check.ts"),
  route("api/debug/analyze-selectors", "routes/api/debug/analyze-selectors.ts"),
  route("api/debug/test-updated-scraper", "routes/api/debug/test-updated-scraper.ts"),
  route("api/debug/page-debug", "routes/api/debug/page-debug.ts"),
  route("api/debug/match-extraction-test", "routes/api/debug/match-extraction-test.ts"),
  route("api/debug/db-status", "routes/api/debug/db-status.ts"),
  route("api/debug/clean-db", "routes/api/debug/clean-db.ts"),

  // Chrome DevTools routes (silent handling)
  route(
    ".well-known/appspecific/com.chrome.devtools.json",
    "routes/resources/empty.tsx"
  ),
] satisfies RouteConfig;
