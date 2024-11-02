import { GitHubUser } from "npm:@hono/oauth-providers/github";
import { IGetUserCredentials } from "../utils/types.ts";

/**
* @description This function retrieves user data from github api and returns either the user data or a regular object with nothing
* @returns GitHubUser | { error: boolean; msg: string }
* @param {IGetUserCredentials} info
*/
export const getUserFromGithub = async (info: IGetUserCredentials) => {
  const { access_token } = info

  const url = new URL("https://api.github.com/user")

  const headers = new Headers()
  headers.set("Authorization", `Bearer ${access_token}`)
  
  try {
    const r = await fetch(url, {
      method: "GET",
      headers
    })

    if (!r.ok) {
      return { error: true, msg: "Error fetching user from github!" }
    }

    const user = await r.json()

    return user as GitHubUser
  } catch (_e) {
    return { error: true, msg: "Error fetching user from github!" }
  }
}
