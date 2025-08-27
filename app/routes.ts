import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),

  // Auth routes with splat for callbacks
  route("login/*", "./routes/login.tsx"),
  route("register/*", "./routes/register.tsx"),

  // Chrome DevTools routes (silent handling)
  route(
    ".well-known/appspecific/com.chrome.devtools.json",
    "./routes/resources/empty.tsx"
  ),
] satisfies RouteConfig;
