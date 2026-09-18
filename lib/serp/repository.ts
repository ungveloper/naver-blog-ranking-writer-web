import type { PoolClient } from "pg";
import { dbPool } from "@/lib/db/pool";
import type { DevicePreference } from "@/lib/product/types";
import {
  NaverIntegratedSearchProvider,
} from "@/lib/serp/naver-integrated";
import type {
  SerpResultOrigin,
  SerpSnapshot,
} from "@/lib/serp/provider";

type HospitalRole = "OWNER" | "EDITOR" | "VIEWER";

type SearchProjectRow = {
  primary_keyword: string;
  device_preference: DevicePreference;
  role: HospitalRole;
};

type SnapshotRow = {
  id: string;
  project_id: string;
  keyword: string;
  device: "MOBILE" | "DESKTOP";
  provider: string;
  search_url: string;
  result_count: number;
  captured_at: string;
};

type ResultRow = {
  id: string;
  snapshot_id: string;
  rank: number;
  title: string;
  url: string;
  normalized_url: string;
  origin: SerpResultOrigin;
  included: boolean;
  exclusion_reason: string | null;
  section_area: string | null;
  block_id: string | null;
  dom_index: number | null;
};

export type StoredSerpCandidate = {
  id: string;
  rank: number;
  title: string;
  url: string;
  normalizedUrl: string;
  origin: SerpResultOrigin;
  included: boolean;
  exclusionReason: string | null;
  sectionArea: string | null;
  blockId: string | null;
  domIndex: number | null;
};

export type StoredSerpSnapshot = {
  id: string;
  projectId: string;
  keyword: string;
  device: "MOBILE" | "DESKTOP";
  provider: string;
  searchUrl: string;
  resultCount: number;
  capturedAt: string;
  candidates: StoredSerpCandidate[];
};

async function getSearchProject(
  userId: string,
  projectId: string,
) {
  const result = await dbPool.query<SearchProjectRow>(
    `
      select
        cp.primary_keyword,
        cp.device_preference,
        hm.role
      from content_projects cp
      join hospital_members hm
        on hm.hospital_id = cp.hospital_id
       and hm.user_id = $1
      where cp.id = $2
        and cp.status = 'ACTIVE'
      limit 1
    `,
    [userId, projectId],
  );

  return result.rows[0] ?? null;
}

function getSearchDevices(
  preference: DevicePreference,
): Array<"MOBILE" | "DESKTOP"> {
  if (preference === "BOTH") {
    return ["MOBILE", "DESKTOP"];
  }

  return [preference];
}

async function saveSnapshot(
  client: PoolClient,
  projectId: string,
  snapshot: SerpSnapshot,
) {
  const snapshotResult = await client.query<{
    id: string;
  }>(
    `
      insert into serp_snapshots (
        project_id,
        keyword,
        device,
        provider,
        search_url,
        response_hash,
        result_count,
        captured_at
      )
      values (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8::timestamptz
      )
      returning id
    `,
    [
      projectId,
      snapshot.keyword,
      snapshot.device,
      snapshot.provider ?? "UNKNOWN",
      snapshot.searchUrl ?? "",
      snapshot.responseHash ?? null,
      snapshot.results.length,
      snapshot.capturedAt,
    ],
  );

  const snapshotId = snapshotResult.rows[0].id;

  for (const result of snapshot.results) {
    await client.query(
      `
        insert into serp_results (
          snapshot_id,
          rank,
          title,
          url,
          normalized_url,
          origin,
          included,
          section_area,
          block_id,
          dom_index
        )
        values (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8,
          $9,
          $10
        )
      `,
      [
        snapshotId,
        result.rank,
        result.title,
        result.url,
        result.normalizedUrl,
        result.origin ?? "INTEGRATED",
        result.included,
        result.sectionArea ?? null,
        result.blockId ?? null,
        result.domIndex ?? null,
      ],
    );
  }

  return snapshotId;
}

export async function searchAndStoreProjectSerp(
  userId: string,
  projectId: string,
) {
  const project = await getSearchProject(
    userId,
    projectId,
  );

  if (
    !project ||
    !["OWNER", "EDITOR"].includes(project.role)
  ) {
    throw new Error("SERP_SEARCH_FORBIDDEN");
  }

  const provider = new NaverIntegratedSearchProvider();
  const devices = getSearchDevices(
    project.device_preference,
  );

  const snapshots: SerpSnapshot[] = [];

  for (const device of devices) {
    snapshots.push(
      await provider.search({
        keyword: project.primary_keyword,
        device,
      }),
    );
  }

  const client = await dbPool.connect();

  try {
    await client.query("begin");

    await client.query(
      `
        delete from project_benchmarks
        where project_id = $1
      `,
      [projectId],
    );

    const stored: Array<{
      id: string;
      device: "MOBILE" | "DESKTOP";
      count: number;
    }> = [];

    for (const snapshot of snapshots) {
      const id = await saveSnapshot(
        client,
        projectId,
        snapshot,
      );

      stored.push({
        id,
        device: snapshot.device,
        count: snapshot.results.length,
      });
    }

    await client.query(
      `
        update content_projects
        set
          workflow_stage = 'BENCHMARK_SELECTION',
          updated_at = now()
        where id = $1
      `,
      [projectId],
    );

    await client.query("commit");

    return stored;
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

export async function getLatestSerpSnapshotsForProject(
  userId: string,
  projectId: string,
): Promise<StoredSerpSnapshot[]> {
  const project = await getSearchProject(
    userId,
    projectId,
  );

  if (!project) {
    return [];
  }

  const snapshotResult =
    await dbPool.query<SnapshotRow>(
      `
        select distinct on (device)
          id,
          project_id,
          keyword,
          device,
          provider,
          search_url,
          result_count,
          captured_at::text
        from serp_snapshots
        where project_id = $1
        order by device, captured_at desc
      `,
      [projectId],
    );

  const snapshots = snapshotResult.rows;

  if (snapshots.length === 0) {
    return [];
  }

  const ids = snapshots.map((snapshot) => snapshot.id);

  const resultRows = await dbPool.query<ResultRow>(
    `
      select
        id,
        snapshot_id,
        rank,
        title,
        url,
        normalized_url,
        origin,
        included,
        exclusion_reason,
        section_area,
        block_id,
        dom_index
      from serp_results
      where snapshot_id = any($1::uuid[])
      order by snapshot_id, rank
    `,
    [ids],
  );

  const resultMap = new Map<
    string,
    StoredSerpCandidate[]
  >();

  for (const row of resultRows.rows) {
    const list = resultMap.get(row.snapshot_id) ?? [];

    list.push({
      id: row.id,
      rank: row.rank,
      title: row.title,
      url: row.url,
      normalizedUrl: row.normalized_url,
      origin: row.origin,
      included: row.included,
      exclusionReason: row.exclusion_reason,
      sectionArea: row.section_area,
      blockId: row.block_id,
      domIndex: row.dom_index,
    });

    resultMap.set(row.snapshot_id, list);
  }

  return snapshots
    .map((snapshot) => ({
      id: snapshot.id,
      projectId: snapshot.project_id,
      keyword: snapshot.keyword,
      device: snapshot.device,
      provider: snapshot.provider,
      searchUrl: snapshot.search_url,
      resultCount: snapshot.result_count,
      capturedAt: snapshot.captured_at,
      candidates: resultMap.get(snapshot.id) ?? [],
    }))
    .sort((a, b) => {
      if (a.device === b.device) {
        return 0;
      }

      return a.device === "MOBILE" ? -1 : 1;
    });
}

export async function resolveSerpBenchmarkSelection(
  userId: string,
  projectId: string,
  snapshotId: string,
  resultIds: string[],
) {
  const project = await getSearchProject(
    userId,
    projectId,
  );

  if (
    !project ||
    !["OWNER", "EDITOR"].includes(project.role)
  ) {
    throw new Error("BENCHMARK_IMPORT_FORBIDDEN");
  }

  if (
    resultIds.length < 1 ||
    resultIds.length > 10
  ) {
    throw new Error(
      "통합검색에 실제 노출된 Naver Blog 글 중 1~10개를 선택하세요.",
    );
  }

  const result = await dbPool.query<{
    id: string;
    url: string;
    rank: number;
  }>(
    `
      select
        sr.id,
        sr.url,
        sr.rank
      from serp_results sr
      join serp_snapshots ss
        on ss.id = sr.snapshot_id
      where ss.id = $1
        and ss.project_id = $2
        and sr.origin = 'INTEGRATED'
        and sr.id = any($3::uuid[])
      order by sr.rank
    `,
    [snapshotId, projectId, resultIds],
  );

  if (result.rows.length !== resultIds.length) {
    throw new Error(
      "선택한 항목 중 현재 통합검색 snapshot의 Naver Blog 결과가 아닌 항목이 있습니다.",
    );
  }

  return result.rows;
}

export async function saveSerpBenchmarkSelection(
  userId: string,
  projectId: string,
  snapshotId: string,
  resultIds: string[],
) {
  const project = await getSearchProject(
    userId,
    projectId,
  );

  if (
    !project ||
    !["OWNER", "EDITOR"].includes(project.role)
  ) {
    throw new Error("BENCHMARK_IMPORT_FORBIDDEN");
  }

  await dbPool.query(
    `
      update serp_results sr
      set
        included = sr.id = any($3::uuid[]),
        exclusion_reason = case
          when sr.id = any($3::uuid[]) then null
          else '사용자 제외'
        end,
        updated_at = now()
      from serp_snapshots ss
      where sr.snapshot_id = ss.id
        and ss.id = $1
        and ss.project_id = $2
    `,
    [snapshotId, projectId, resultIds],
  );
}
