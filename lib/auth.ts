import { betterAuth } from "better-auth";
import { authConfiguration } from "@/lib/auth-config";
import { dbPool } from "@/lib/db/pool";

const BUILD_ONLY_AUTH_SECRET =
  "build-only-placeholder-secret-not-for-runtime-use-20260917";

const socialProviders = {
  ...(authConfiguration.google
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID as string,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        },
      }
    : {}),
  ...(authConfiguration.naver
    ? {
        naver: {
          clientId: process.env.NAVER_CLIENT_ID as string,
          clientSecret: process.env.NAVER_CLIENT_SECRET as string,
        },
      }
    : {}),
};

export const auth = betterAuth({
  appName: "Naver Blog Ranking Writer",
  baseURL: authConfiguration.baseUrl,
  secret: process.env.BETTER_AUTH_SECRET || BUILD_ONLY_AUTH_SECRET,
  database: dbPool,
  advanced: {
    database: {
      joins: true,
    },
  },
  socialProviders,
});
