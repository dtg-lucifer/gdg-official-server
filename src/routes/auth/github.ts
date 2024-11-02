import { Hono } from "hono";
import { setSignedCookie } from "hono/cookie";
import { githubAuth, GitHubUser } from "npm:@hono/oauth-providers/github";
import { getEnv } from "../../utils/env.ts";
import { ApiResponse } from "../../utils/apiResponse.ts";
import { getUserFromGithub } from "../../services/user.ts";

const githubRouter = new Hono()

githubRouter.use(
  "/", 
  githubAuth({
    client_id: getEnv("GITHUB_CLIENT_ID"),
    client_secret: getEnv("GITHUB_CLIENT_SECRET"),
    scope: ['public_repo', 'read:user', 'user', 'user:email', 'user:follow'],
    oauthApp: true
  })
)

githubRouter.get(
  "/callback",
  async (c) => {

    // grab the access code and state returned from the github provider
    const tempCode = c.req.query("code")!
    const state = c.req.query("state")!

    // build the url and headers from those
    const url = new URL("https://github.com/login/oauth/access_token")
    url.searchParams.set("code", tempCode)
    url.searchParams.set("state", state)
    url.searchParams.set("client_id", getEnv("GITHUB_CLIENT_ID")!)
    url.searchParams.set("client_secret", getEnv("GITHUB_CLIENT_SECRET")!)

    const headers = new Headers()
    headers.set("Accept", "application/json")

    try {

      const response = await fetch(url, {
        method: "POST",
        headers 
      })

      if (!response.ok) return c.json(
        new ApiResponse(
          response.status, 
          {
            error: (await response.text())
          }, 
          (await response.text())
        )
      )

      // if the request to the github api is successful then it will return the accesstoken
      const { access_token, token_type, scope } = await response.json()

      const cookieData = {
        access_token,
        token_type,
        scope
      }

      // this returns the user or a regular object consisting error message
      const user = await getUserFromGithub({access_token, token_type, scope})

      if (!(typeof user === typeof ({} as GitHubUser))) {
        return c.json(
          new ApiResponse(
            401, 
            {...user}
          ),
          401
        )
      }

      console.log("User:", user)

      await setSignedCookie(
        c, 
        "github_token", 
        JSON.stringify(cookieData), 
        getEnv("COOKIE_SECRET")!,
        {
          path: "/",
          maxAge: 60 * 60 * 24 * 7,
          secure: true,
          httpOnly: true,
          sameSite: "none",
          signingSecret: getEnv("COOKIE_SECRET")!
        }
      )

      return c.json(new ApiResponse(201, { token_type }), 201)

    } catch (e) {

      return c.json(
        new ApiResponse(
          401, 
          {
            error: "Bad request"
          },
          (e as Error).message
        ),
        401
      )

    }
  }
)

  export { githubRouter }
