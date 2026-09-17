import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";
import { coreAuthConfigured } from "@/lib/auth-config";

export const runtime = "nodejs";

const handlers = toNextJsHandler(auth);

function notConfiguredResponse() {
  return Response.json(
    {
      error: "AUTH_NOT_CONFIGURED",
      message:
        "DATABASE_URL 및 BETTER_AUTH_SECRET을 먼저 설정해야 합니다.",
    },
    { status: 503 },
  );
}

export async function GET(request: Request) {
  if (!coreAuthConfigured) return notConfiguredResponse();
  return handlers.GET(request);
}

export async function POST(request: Request) {
  if (!coreAuthConfigured) return notConfiguredResponse();
  return handlers.POST(request);
}
