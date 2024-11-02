import { Hono } from "hono";
import { loginRouter } from "./login.ts";
import { registerRouter } from "./register.ts";
import { githubRouter } from "./github.ts";

const authRouter = new Hono();

authRouter.route("/login", loginRouter)
authRouter.route("/register", registerRouter)
authRouter.route("/oauth/github", githubRouter)

export { authRouter }
