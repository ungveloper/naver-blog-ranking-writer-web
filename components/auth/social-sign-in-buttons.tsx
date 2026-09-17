"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

type Provider = "google" | "naver";

type Props = {
  googleEnabled: boolean;
  naverEnabled: boolean;
};

export function SocialSignInButtons({
  googleEnabled,
  naverEnabled,
}: Props) {
  const [pending, setPending] = useState<Provider | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function signIn(provider: Provider) {
    setError(null);
    setPending(provider);

    try {
      const result = await authClient.signIn.social({
        provider,
        callbackURL: "/",
        errorCallbackURL: "/sign-in?error=oauth",
      });

      if (result.error) {
        setError(result.error.message || "로그인을 시작하지 못했습니다.");
        setPending(null);
      }
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "로그인을 시작하지 못했습니다.",
      );
      setPending(null);
    }
  }

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="w-full"
        disabled={!googleEnabled || pending !== null}
        onClick={() => signIn("google")}
      >
        {pending === "google" ? "Google 연결 중..." : "Google로 로그인"}
      </Button>

      <Button
        type="button"
        size="lg"
        className="w-full"
        disabled={!naverEnabled || pending !== null}
        onClick={() => signIn("naver")}
      >
        {pending === "naver" ? "Naver 연결 중..." : "Naver로 로그인"}
      </Button>

      {!googleEnabled || !naverEnabled ? (
        <p className="text-xs leading-5 text-muted-foreground">
          비활성화된 로그인 방식은 아직 OAuth 환경변수가 설정되지 않은
          상태입니다.
        </p>
      ) : null}

      {error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
