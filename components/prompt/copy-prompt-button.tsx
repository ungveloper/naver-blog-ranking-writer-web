"use client";

import { useState } from "react";

type Props = {
  text: string;
};

export function CopyPromptButton({
  text,
}: Props) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);

    window.setTimeout(() => {
      setCopied(false);
    }, 1800);
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex min-h-10 items-center justify-center rounded-md bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700"
    >
      {copied
        ? "복사 완료"
        : "ChatGPT Pro 프롬프트 복사"}
    </button>
  );
}
