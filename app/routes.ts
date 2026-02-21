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
    route("app/entry/:id", "routes/app.entry.$id.tsx"),
    route("app/personality", "routes/app.personality.tsx"),
  ]),
] satisfies RouteConfig;
