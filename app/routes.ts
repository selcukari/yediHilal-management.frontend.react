import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [index("routes/member.tsx"), route("login", "routes/login.tsx")] satisfies RouteConfig;

