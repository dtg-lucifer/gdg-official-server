import { MiddlewareHandler } from "hono";
import { Counter } from "prom-client";

export const httpRequestCounter = new Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method"],
});

export const httpResponseCounter = new Counter({
  name: "http_responses_total",
  help: 'Total number of HTTP responses',
  labelNames: ['status', 'path'],
});

export const metricsMiddleware: MiddlewareHandler = async (c, next) => {
  const { method } = c.req;
  const { status } = c.res;
  const path = c.req.matchedRoutes.find((r) => r.method !== 'ALL')?.path ?? c.req.routePath; 
  
  await next();
  
  if (!path.split("/").some(s => s == "metrics")) {
    httpRequestCounter.inc({ method });
    httpResponseCounter.inc({ status, path });
  }
};