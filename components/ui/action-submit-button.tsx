"use client";

import { useFormStatus } from "react-dom";

type Tone = "blue" | "emerald" | "violet";

type Props = {
  idleLabel: string;
  pendingLabel: string;
  tone?: Tone;
  disabled?: boolean;
  className?: string;
};

const toneClasses: Record<Tone, string> = {
  blue:
    "bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500",
  emerald:
    "bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-500",
  violet:
    "bg-violet-600 text-white hover:bg-violet-700 focus-visible:ring-violet-500",
};

export function ActionSubmitButton({
  idleLabel,
  pendingLabel,
  tone = "blue",
  disabled = false,
  className = "",
}: Props) {
  const { pending } = useFormStatus();
  const isDisabled = pending || disabled;

  return (
    <button
      type="submit"
      disabled={isDisabled}
      aria-busy={pending}
      className={[
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-55",
        toneClasses[tone],
        className,
      ].join(" ")}
    >
      {pending ? (
        <span
          aria-hidden="true"
          className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent"
        />
      ) : null}
      <span>
        {pending ? pendingLabel : idleLabel}
      </span>
    </button>
  );
}
