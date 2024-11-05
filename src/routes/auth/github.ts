import { Hono } from "hono";
import { setSignedCookie } from "hono/cookie";
import { githubAuth, GitHubUser } from "npm:@hono/oauth-providers/github";
import { getEnv } from "../../utils/env.ts";
import { ApiResponse } from "../../utils/apiResponse.ts";
import { getUserFromGithub } from "../../services/user.ts";
import { sign } from "hono/jwt";
import { I_GHOauthJwtPayload } from "../../utils/types.ts";

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
    // also return error if the state or the code is not present on the url
    // that means that the reques is not pure
    const tempCode = c.req.query("code")
    const state = c.req.query("state")

    if (!tempCode || tempCode === undefined || tempCode === null) {
      return c.json(
        new ApiResponse(
          501, 
          {err: "Cannot find the code parameter in the url, please try again"}
        ),
        501
      ) 
    }


    if (!state || state === undefined || state === null) {
      return c.json(
        new ApiResponse(
          501, 
          {err: "Cannot find the state parameter in the url, please try again"}
        ),
        501
      ) 
    }

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

      console.log("Token before signing: ", { access_token });      

      // this returns the user or a regular object consisting error message
      let user: GitHubUser
      
      try {

        user = await getUserFromGithub({ access_token, token_type, scope })

      } catch (error) {

        return c.json(
          new ApiResponse(
            401, 
            {err: error}
          ),
          401
        ) 
      }

      console.log("Logged in user email: ", (user as GitHubUser).email)

      // sign the access token to store securely on the client end
      let signedAccessToken: string

      try {

        signedAccessToken = await sign({
          access_token,
          user_email: (user as GitHubUser).email,
          user_name: (user as GitHubUser).login
        } as I_GHOauthJwtPayload, getEnv("JWT_SECRET")!)

      } catch (e) {

        return c.json(
          new ApiResponse(
            401, 
            {err: e}
          ),
          401
        ) 

      }

      console.log("Token after signing: ", { signedAccessToken });

      const cookieData = {
        signedAccessToken,
        token_type,
        scope
      }

      // set the cookie as secuer and httpOnly 
      try {
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
      } catch (e) {

        return c.json(
          new ApiResponse(
            401, 
            {err: e}
          ),
          401
        ) 
      }

      return c.json(
        new ApiResponse(
          201, 
          { 
            token_type, jwt: signedAccessToken, 
            userEmail: (user as GitHubUser).email, 
            userName: (user as GitHubUser).login 
          }, 
          "User verified successfully"
        ), 
        201
      )

    } catch (e) {

      // otherwise send a generic error if anything goes west
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
