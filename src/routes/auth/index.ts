import { Hono } from "hono";
import { githubRouter } from "./github.ts";
import { googleRouter } from "./google.ts";

const authRouter = new Hono();

authRouter.route("/oauth/github", githubRouter)
authRouter.route("/oauth/google", googleRouter)

export { authRouter }
