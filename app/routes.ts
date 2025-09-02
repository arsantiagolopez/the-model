import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),

  // Auth routes with splat for callbacks
  route("login/*", "./routes/login.tsx"),
  route("register/*", "./routes/register.tsx"),

  // Admin routes
  route("admin/scraper", "./routes/admin.scraper.tsx"),

  // API routes
  route("api/scraper", "./routes/api.scraper.ts"),

  // Model routes
  route("model/yesterday", "./routes/model.yesterday.tsx"),
  route("model/today", "./routes/model.today.tsx"),
  route("model/tomorrow", "./routes/model.tomorrow.tsx"),
  route("model/tournaments/:id", "./routes/model.tournament.tsx"),
  route("model/players/:id", "./routes/model.player.tsx"),
  route("model/matches/:id", "./routes/model.match.tsx"),

  // Chrome DevTools routes (silent handling)
  route(
    ".well-known/appspecific/com.chrome.devtools.json",
    "./routes/resources/empty.tsx"
  ),
] satisfies RouteConfig;
