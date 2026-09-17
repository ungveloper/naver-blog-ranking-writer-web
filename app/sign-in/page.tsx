import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SocialSignInButtons } from "@/components/auth/social-sign-in-buttons";
import { auth } from "@/lib/auth";
import {
  authConfiguration,
  coreAuthConfigured,
} from "@/lib/auth-config";

export default async function SignInPage() {
  if (!coreAuthConfigured) {
    redirect("/setup");
  }

  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (session) {
      redirect("/");
    }
  } catch {
    redirect("/setup?reason=database");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-6 py-16">
      <section className="w-full max-w-md rounded-2xl border bg-background p-7 shadow-sm">
        <div className="mb-7">
          <p className="text-sm font-medium text-muted-foreground">
            naver-blog-ranking-writer-web
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            로그인
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            담당 병원과 Hospital Profile, 콘텐츠 프로젝트를 계정별로
            관리합니다.
          </p>
        </div>

        <SocialSignInButtons
          googleEnabled={authConfiguration.google}
          naverEnabled={authConfiguration.naver}
        />
      </section>
    </main>
  );
}
