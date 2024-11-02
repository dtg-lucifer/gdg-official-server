import { Hono } from "hono";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";

import { corsConfig } from "./src/middlewares/cors.ts";

import { hcRouter } from "./src/routes/healthcheck/healthcheck.ts";
import { authRouter } from "./src/routes/auth/index.ts";
import { metricsMiddleware } from "./src/middlewares/metrics.ts";
import { register } from "prom-client";
import { getEnv } from "./src/utils/env.ts";

// constants
const app = new Hono().basePath("/api/v1");

// middlewares
app.use("*", corsConfig);
app.use('*', metricsMiddleware);
app.use(logger());
app.use(prettyJSON())

// routes
app.route("/healthcheck", hcRouter);
app.route("/auth", authRouter);

// metrics
app.get('/metrics', async (c) => {
  const metrics = await register.metrics();
  const headers: HeadersInit = {
    'Content-Type': register.contentType,
  };
  return c.text(metrics, 200, headers);
});

// not found
app.notFound((c) => c.json({ message: 'Not Found', ok: false }, 404))

Deno.serve({ port: parseInt(getEnv("PORT")!) }, app.fetch);
