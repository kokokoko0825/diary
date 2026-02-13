import {
  type RouteConfig,
  index,
  route,
  layout,
} from "@react-router/dev/routes";

export default [
  index("routes/_index.tsx"),
  layout("routes/app.tsx", [
    route("app/quiz", "routes/app.quiz.tsx"),
    route("app/dashboard", "routes/app.dashboard.tsx"),
  ]),
] satisfies RouteConfig;
