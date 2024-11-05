import { JWTPayload } from "hono/utils/jwt/types";

export interface IGetUserCredentials {
  access_token: string
  token_type: string
  scope: string
}

export interface User {
  fullName: string
}

export interface I_GHOauthJwtPayload extends JWTPayload {
  access_token: string
  user_email: string
  user_name: string
}
