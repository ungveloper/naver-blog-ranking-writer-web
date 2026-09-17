import Link from "next/link";
import { authConfiguration } from "@/lib/auth-config";

function Status({ ok }: { ok: boolean }) {
  return (
    <span
      className={
        ok
          ? "rounded-full border px-2 py-0.5 text-xs font-medium"
          : "rounded-full border border-destructive/30 bg-destructive/5 px-2 py-0.5 text-xs font-medium text-destructive"
      }
    >
      {ok ? "설정됨" : "필요"}
    </span>
  );
}

export default function SetupPage() {
  const coreReady = authConfiguration.database && authConfiguration.secret;

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-6 py-16">
      <p className="text-sm font-medium text-muted-foreground">Phase 1</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        인증 환경 설정
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
        실제 값은 Git에 커밋하지 않고 프로젝트 루트의 .env.local에만
        저장합니다. Secret 값은 화면에 표시하지 않습니다.
      </p>

      <div className="mt-8 divide-y rounded-xl border">
        <div className="flex items-center justify-between gap-4 p-4">
          <div>
            <p className="font-medium">Supabase PostgreSQL</p>
            <p className="text-sm text-muted-foreground">DATABASE_URL</p>
          </div>
          <Status ok={authConfiguration.database} />
        </div>
        <div className="flex items-center justify-between gap-4 p-4">
          <div>
            <p className="font-medium">Better Auth Secret</p>
            <p className="text-sm text-muted-foreground">BETTER_AUTH_SECRET</p>
          </div>
          <Status ok={authConfiguration.secret} />
        </div>
        <div className="flex items-center justify-between gap-4 p-4">
          <div>
            <p className="font-medium">Google OAuth</p>
            <p className="text-sm text-muted-foreground">
              GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET
            </p>
          </div>
          <Status ok={authConfiguration.google} />
        </div>
        <div className="flex items-center justify-between gap-4 p-4">
          <div>
            <p className="font-medium">Naver OAuth</p>
            <p className="text-sm text-muted-foreground">
              NAVER_CLIENT_ID / NAVER_CLIENT_SECRET
            </p>
          </div>
          <Status ok={authConfiguration.naver} />
        </div>
      </div>

      <div className="mt-6 rounded-xl bg-muted p-5 text-sm leading-6">
        자세한 순서는 <code>docs/AUTH-SETUP.md</code>에 고정되어 있습니다.
        환경변수를 변경한 뒤에는 개발 서버를 다시 시작하세요.
      </div>

      {coreReady ? (
        <Link
          href="/sign-in"
          className="mt-6 inline-flex h-9 items-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground"
        >
          로그인 화면으로 이동
        </Link>
      ) : null}
    </main>
  );
}
