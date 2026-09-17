import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { coreAuthConfigured } from "@/lib/auth-config";

export async function proxy(request: NextRequest) {
  if (!coreAuthConfigured) {
    return NextResponse.redirect(new URL("/setup", request.url));
  }

  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      const signInUrl = new URL("/sign-in", request.url);
      signInUrl.searchParams.set("next", request.nextUrl.pathname);
      return NextResponse.redirect(signInUrl);
    }

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(
      new URL("/setup?reason=database", request.url),
    );
  }
}

export const config = {
  matcher: ["/", "/hospitals/:path*", "/projects/:path*"],
};
