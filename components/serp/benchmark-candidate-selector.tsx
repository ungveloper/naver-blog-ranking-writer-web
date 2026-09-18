"use client";

/* eslint-disable @next/next/no-img-element */

import { useMemo, useState } from "react";
import { finalizeSerpBenchmarkAction } from "@/app/projects/[projectId]/analysis/actions";
import { ActionSubmitButton } from "@/components/ui/action-submit-button";

export type BenchmarkCandidateItem = {
  id: string;
  rank: number;
  title: string;
  snippet: string | null;
  sourceName: string | null;
  thumbnailUrl: string | null;
  url: string;
  origin: "INTEGRATED" | "VIEW_FALLBACK";
  included: boolean;
  sectionKind:
    | "REVIEW_BLOG"
    | "WEB_BLOG"
    | "OTHER"
    | null;
};

type Filter =
  | "ALL"
  | "REVIEW_BLOG"
  | "WEB_BLOG"
  | "OTHER";

type Props = {
  projectId: string;
  snapshotId: string;
  candidates: BenchmarkCandidateItem[];
  legacySnapshot?: boolean;
};

const FILTERS: Array<{
  id: Filter;
  label: string;
}> = [
  {
    id: "ALL",
    label: "전체",
  },
  {
    id: "REVIEW_BLOG",
    label: "후기형 블록",
  },
  {
    id: "WEB_BLOG",
    label: "웹문서형 블록",
  },
  {
    id: "OTHER",
    label: "기타 블록",
  },
];

function sectionLabel(
  sectionKind: BenchmarkCandidateItem["sectionKind"],
) {
  if (sectionKind === "REVIEW_BLOG") {
    return "후기형 블록";
  }

  if (sectionKind === "WEB_BLOG") {
    return "웹문서형 블록";
  }

  if (sectionKind === "OTHER") {
    return "기타 블록";
  }

  return "구 snapshot";
}

function getBlogId(url: string) {
  try {
    return (
      new URL(url).pathname
        .split("/")
        .filter(Boolean)[0] || "Naver Blog"
    );
  } catch {
    return "Naver Blog";
  }
}

export function BenchmarkCandidateSelector({
  projectId,
  snapshotId,
  candidates,
  legacySnapshot = false,
}: Props) {
  const initialSelected = useMemo(() => {
    const stored = candidates
      .filter((candidate) => candidate.included)
      .map((candidate) => candidate.id);

    if (stored.length >= 1 && stored.length <= 10) {
      return stored;
    }

    return candidates
      .slice(0, Math.min(7, candidates.length))
      .map((candidate) => candidate.id);
  }, [candidates]);

  const [selected, setSelected] = useState<
    Set<string>
  >(() => new Set(initialSelected));
  const [filter, setFilter] =
    useState<Filter>("ALL");
  const [query, setQuery] = useState("");

  const selectedCount = selected.size;
  const valid =
    selectedCount >= 1 && selectedCount <= 10;

  const visibleCandidates = useMemo(() => {
    const normalizedQuery = query
      .trim()
      .toLocaleLowerCase("ko-KR");

    return candidates.filter((candidate) => {
      const filterMatches =
        filter === "ALL" ||
        candidate.sectionKind === filter;

      if (!filterMatches) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const haystack = [
        candidate.title,
        candidate.snippet || "",
        candidate.sourceName || "",
        candidate.url,
      ]
        .join(" ")
        .toLocaleLowerCase("ko-KR");

      return haystack.includes(normalizedQuery);
    });
  }, [candidates, filter, query]);

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

      {Array.from(selected).map((id) => (
        <input
          key={id}
          type="hidden"
          name="resultId"
          value={id}
        />
      ))}

      <div className="grid gap-3 rounded-xl border bg-muted/20 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm">
            선택{" "}
            <strong>{selectedCount}</strong>/
            {Math.min(10, candidates.length)}
            <span className="ml-2 text-muted-foreground">
              · 권장 표본 5~10개
            </span>
          </p>
          <div className="flex items-center gap-2 text-xs">
            <span className="rounded-full bg-blue-600 px-2.5 py-1 font-semibold text-white">
              통합검색
            </span>
            <span className="rounded-full bg-emerald-600 px-2.5 py-1 font-semibold text-white">
              Naver Blog 문서
            </span>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <input
            value={query}
            onChange={(event) =>
              setQuery(event.target.value)
            }
            placeholder="제목 · 출처 · 내용에서 검색"
            className="min-h-10 rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/40"
          />

          <div className="flex flex-wrap gap-2">
            {FILTERS.map((item) => {
              const active = filter === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFilter(item.id)}
                  className={[
                    "rounded-md border px-3 py-2 text-xs font-medium transition",
                    active
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "bg-background hover:bg-muted",
                  ].join(" ")}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          현재 조건에서 {visibleCandidates.length}개 표시 ·
          체크 선택은 필터를 바꿔도 유지됩니다.
        </p>
      </div>

      {legacySnapshot ? (
        <div className="rounded-lg border border-amber-500/40 bg-amber-50 p-3 text-xs leading-5 text-amber-950">
          현재 화면에는 제목/출처 분리 기능 적용 전의 구
          snapshot이 포함돼 있습니다. 위의{" "}
          <strong>현재 통합검색 다시 수집</strong>을 한 번
          실행하면 새 형식으로 제목·출처·요약이 분리됩니다.
        </div>
      ) : null}

      {candidates.length < 5 ? (
        <div className="rounded-lg border border-amber-500/30 bg-amber-50 p-3 text-xs leading-5 text-amber-950">
          현재 통합검색에서 확인된 Naver Blog 게시글이{" "}
          <strong>{candidates.length}개</strong>뿐입니다.
          별도 블로그탭 결과를 섞지 않고 이 표본만
          분석합니다.
        </div>
      ) : null}

      <div className="grid gap-3">
        {visibleCandidates.map((candidate) => {
          const checked = selected.has(candidate.id);
          const sourceName =
            candidate.sourceName ||
            getBlogId(candidate.url);

          return (
            <article
              key={candidate.id}
              className={[
                "grid gap-3 rounded-xl border p-4 transition",
                checked
                  ? "border-blue-300 bg-blue-50/50"
                  : "hover:bg-muted/20",
              ].join(" ")}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() =>
                    toggle(candidate.id)
                  }
                  aria-label={`${candidate.rank}번 Benchmark 후보 선택`}
                  className="mt-1 size-4"
                />

                <div className="h-20 w-24 shrink-0 overflow-hidden rounded-lg border bg-muted md:h-24 md:w-32">
                  {candidate.thumbnailUrl ? (
                    <img
                      src={candidate.thumbnailUrl}
                      alt=""
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center px-2 text-center text-[10px] text-muted-foreground">
                      썸네일 없음
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-slate-700">
                      #{candidate.rank}
                    </span>
                    <span className="rounded-full bg-blue-600 px-2.5 py-1 text-[11px] font-semibold text-white">
                      통합검색
                    </span>
                    <span className="rounded-full bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white">
                      Naver Blog
                    </span>
                    <span className="rounded-full border bg-background px-2.5 py-1 text-[11px] font-medium">
                      {sectionLabel(
                        candidate.sectionKind,
                      )}
                    </span>
                  </div>

                  <p className="mt-3 text-xs font-medium text-muted-foreground">
                    {sourceName}
                  </p>

                  <h3 className="mt-1 text-base font-bold leading-6 text-foreground">
                    {candidate.title}
                  </h3>

                  {candidate.snippet ? (
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">
                      {candidate.snippet}
                    </p>
                  ) : null}

                  <a
                    href={candidate.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 block truncate text-xs text-blue-700 underline underline-offset-4"
                  >
                    {candidate.url}
                  </a>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {visibleCandidates.length === 0 ? (
        <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          현재 필터 조건에 맞는 후보가 없습니다.
        </div>
      ) : null}

      <div className="sticky bottom-4 z-10 flex flex-wrap items-center gap-3 rounded-xl border bg-background/95 p-4 shadow-lg backdrop-blur">
        <ActionSubmitButton
          idleLabel={`선택 ${selectedCount}개 Benchmark 분석`}
          pendingLabel="선택 글 본문·이미지 분석 중..."
          tone="emerald"
          disabled={!valid}
        />

        {!valid ? (
          <p className="text-xs text-destructive">
            최소 1개 이상 선택해야 합니다.
          </p>
        ) : selectedCount < 5 ? (
          <p className="text-xs text-amber-700">
            제한 표본으로 분석합니다.
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Naver Blog 원문 파싱 → Article Features 저장 →
            분석 결과 갱신
          </p>
        )}
      </div>
    </form>
  );
}
