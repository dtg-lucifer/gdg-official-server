import { GitHubUser } from "npm:@hono/oauth-providers/github";
import { IGetUserCredentials } from "../utils/types.ts";

/**
* @description This function retrieves user data from github api and returns either the user data or a regular object with nothing
* @returns GitHubUser 
* @param {IGetUserCredentials} info
*/
export const getUserFromGithub = async (info: IGetUserCredentials): Promise<GitHubUser> => {
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
      throw new Error("Failed to fetch the user details") 
    }

    const user = await r.json()

    return user as GitHubUser
  } catch (_e) {
    throw new Error("Failed to fetch the user details") 
  }
}
