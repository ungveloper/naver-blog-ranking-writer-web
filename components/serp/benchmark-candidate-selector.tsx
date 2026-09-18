"use client";

import { useMemo, useState } from "react";
import { finalizeSerpBenchmarkAction } from "@/app/projects/[projectId]/analysis/actions";

export type BenchmarkCandidateItem = {
  id: string;
  rank: number;
  title: string;
  url: string;
  origin: "INTEGRATED" | "VIEW_FALLBACK";
  included: boolean;
};

type Props = {
  projectId: string;
  snapshotId: string;
  candidates: BenchmarkCandidateItem[];
};

export function BenchmarkCandidateSelector({
  projectId,
  snapshotId,
  candidates,
}: Props) {
  const initialSelected = useMemo(() => {
    const stored = candidates
      .filter((candidate) => candidate.included)
      .map((candidate) => candidate.id);

    if (stored.length >= 5 && stored.length <= 10) {
      return stored;
    }

    return candidates
      .slice(0, Math.min(7, candidates.length))
      .map((candidate) => candidate.id);
  }, [candidates]);

  const [selected, setSelected] = useState<
    Set<string>
  >(() => new Set(initialSelected));

  const selectedCount = selected.size;
  const valid =
    selectedCount >= 5 && selectedCount <= 10;

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);

      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < 10) {
        next.add(id);
      }

      return next;
    });
  }

  return (
    <form
      action={finalizeSerpBenchmarkAction}
      className="grid gap-4"
    >
      <input
        type="hidden"
        name="projectId"
        value={projectId}
      />
      <input
        type="hidden"
        name="snapshotId"
        value={snapshotId}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-muted/40 px-4 py-3 text-sm">
        <p>
          선택{" "}
          <strong>{selectedCount}</strong>/10
          <span className="ml-2 text-muted-foreground">
            · 최종 Benchmark는 5~10개
          </span>
        </p>
        <p className="text-xs text-muted-foreground">
          통합검색 노출 후보를 우선 사용합니다.
        </p>
      </div>

      <div className="grid gap-3">
        {candidates.map((candidate) => {
          const checked = selected.has(candidate.id);

          return (
            <label
              key={candidate.id}
              className={[
                "grid cursor-pointer gap-3 rounded-xl border p-4 transition",
                checked
                  ? "border-foreground/30 bg-muted/30"
                  : "hover:bg-muted/20",
              ].join(" ")}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  name="resultId"
                  value={candidate.id}
                  checked={checked}
                  onChange={() => toggle(candidate.id)}
                  className="mt-1"
                />

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      #{candidate.rank}
                    </span>
                    <span className="rounded-full border px-2 py-0.5 text-[11px]">
                      {candidate.origin === "INTEGRATED"
                        ? "통합검색 노출"
                        : "VIEW 보완 후보"}
                    </span>
                  </div>

                  <p className="mt-2 text-sm font-medium leading-6">
                    {candidate.title}
                  </p>

                  <a
                    href={candidate.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 block truncate text-xs text-muted-foreground underline underline-offset-4"
                    onClick={(event) =>
                      event.stopPropagation()
                    }
                  >
                    {candidate.url}
                  </a>
                </div>
              </div>
            </label>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={!valid}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          선택한 글로 Benchmark 분석
        </button>

        {!valid ? (
          <p className="text-xs text-destructive">
            5~10개를 선택해야 분석할 수 있습니다.
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            선택 글의 본문·이미지·키워드 패턴을 실제로
            파싱해 저장합니다.
          </p>
        )}
      </div>
    </form>
  );
}
