import { Hono } from "hono";
import { GoogleAuthProvider, signInWithCredential } from "npm:firebase/auth";

import { fbAuth } from "../../../firebase/config.ts"
import { ApiResponse } from "../../utils/apiResponse.ts";
import { getEnv } from "../../utils/env.ts";

const googleRouter = new Hono()

googleRouter.get("/", (c) => {
  // redirect user to the google oauth consent screen
  try {
    const redirectUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth")
    redirectUrl.searchParams.set("client_id", getEnv("GOOGLE_CLIENT_ID")!)
    redirectUrl.searchParams.set("redirect_uri", `${c.req.url}/callback`)
    redirectUrl.searchParams.set("response_type", "code")
    redirectUrl.searchParams.set("scope", "profile email openid")

    return c.redirect(redirectUrl)    
  } catch (e) {
    return c.json(
      new ApiResponse(
        401,
        {err: (e as Error).message}
      ),
      401
    )
  }
})

googleRouter.get("/callback", async c => {

  // get the temporary code from the url, set by google oauth
  const tempCode = c.req.query("code")

  if (!tempCode) {
    return c.json(
      new ApiResponse(
        401,
        {err: "NO CODE!"}
      ),
      401
    )
  }

  // request for a token which will be therefore used for making a request
  // this token is mainly used tor creating authorised requests
  const tokenUrl = new URL("https://oauth2.googleapis.com/token")

  const tokenHeaders = new Headers()
  tokenHeaders.set("Content-Type", 'application/x-www-form-urlencoded')

  const tokenResponse = await fetch(tokenUrl, {
    method: "POST",
    headers: tokenHeaders,
    body: new URLSearchParams({
      client_id: getEnv("GOOGLE_CLIENT_ID")!,
      client_secret: getEnv("GOOGLE_CLIENT_SECRET")!,
      redirect_uri: `http://localhost:8998/api/v1/auth/oauth/google/callback`,
      code: tempCode,
      grant_type: 'authorization_code',
    })
  })

  if (!tokenResponse.ok) {
    const e = await tokenResponse.text()

    return c.json(
      new ApiResponse(
        401,
        {
          err: "Can't fetch the token",
          msg: e.toString()
        }
      ),
      401
    )
  }

  // parse the token
  const tokenData = await tokenResponse.json()

  try {
    const cred = GoogleAuthProvider.credential(tokenData.id_token)
    const userCred = await signInWithCredential(fbAuth, cred)

    // sign the token and save it as cookie with jwt
    const token = await userCred.user.getIdToken()

    console.log("User details: ", {...userCred.user})
    return c.json(
      new ApiResponse(
        201,
        {
          message: "Logged in!",
          user: userCred.user
        }
      )
    )
  } catch (e) {
    return c.json(
      new ApiResponse(
        401,
        {
          msg: (e as Error).toString()
        }
      ),
      401
    )
  }
})

export { googleRouter }
