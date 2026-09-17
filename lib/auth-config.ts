export const authConfiguration = {
  database: Boolean(process.env.DATABASE_URL),
  secret: Boolean(process.env.BETTER_AUTH_SECRET),
  baseUrl: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  google: Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
  ),
  naver: Boolean(
    process.env.NAVER_CLIENT_ID && process.env.NAVER_CLIENT_SECRET,
  ),
};

export const coreAuthConfigured =
  authConfiguration.database && authConfiguration.secret;

export const anySocialProviderConfigured =
  authConfiguration.google || authConfiguration.naver;
