import { initializeApp } from "npm:firebase/app";
import { getAuth, GoogleAuthProvider } from "npm:firebase/auth";

import { getEnv } from "../src/utils/env.ts";

const firebaseConfig = {
  apiKey: getEnv("FB_API_KEY"), 
  authDomain: getEnv("FB_AUTH_DOMAIN"),
  projectId: getEnv("FB_PROJECT_ID"),
  storageBucket: getEnv("FB_STORAGE_BUCKET"),
  messagingSenderId: getEnv("FB_MESSAGIN_SENDER_ID"),
  appId: getEnv("FB_APP_ID")
};

const googleProvider = new GoogleAuthProvider()

googleProvider.addScope("https://www.googleapis.com/auth/userinfo.email")
googleProvider.addScope("https://www.googleapis.com/auth/userinfo.profile")
googleProvider.addScope("openid")
googleProvider.addScope("email")
googleProvider.addScope("profile")

export const app = initializeApp(firebaseConfig);
export const fbAuth = getAuth(app)
export { googleProvider }
