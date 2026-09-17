import type { PoolClient } from "pg";
import { dbPool } from "@/lib/db/pool";
import {
  normalizeNaverBookingUrl,
  normalizeOptionalUrl,
} from "@/lib/hospitals/url";
import type { CreateHospitalProfileFormInput } from "@/lib/hospitals/schema";

export type HospitalRole = "OWNER" | "EDITOR" | "VIEWER";
export type HospitalProfileStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";

export type HospitalMembershipListItem = {
  id: string;
  name: string;
  slug: string;
  websiteUrl: string | null;
  isTest: boolean;
  role: HospitalRole;
  profileStatus: HospitalProfileStatus;
  sourceCount: number;
  factCount: number;
};

export type HospitalProfileDetails = {
  id: string;
  name: string;
  englishName: string | null;
  slug: string;
  websiteUrl: string | null;
  address: string | null;
  phone: string | null;
  fax: string | null;
  openedOn: string | null;
  summary: string | null;
  philosophy: string | null;
  isTest: boolean;
  role: HospitalRole;
  profileStatus: HospitalProfileStatus;
  profileVersion: number;
  sources: HospitalSource[];
  serviceOfferings: HospitalServiceOffering[];
  specialties: HospitalSpecialty[];
  facts: HospitalFact[];
  brandClaims: HospitalBrandClaim[];
  ctas: HospitalCta[];
  writingPreferences: HospitalWritingPreferences | null;
};

export type HospitalSource = {
  id: string;
  kind: string;
  label: string;
  url: string | null;
  status: string;
  isPrimary: boolean;
  sourceDate: string | null;
  versionLabel: string | null;
  contentText: string | null;
  notes: string | null;
};

export type HospitalServiceOffering = {
  id: string;
  channel: string;
  title: string;
  detail: string;
  bookingLabel: string | null;
  sortOrder: number;
  status: string;
  sourceLabel: string | null;
};

export type HospitalSpecialty = {
  id: string;
  name: string;
  priority: number | null;
  isMarketingPriority: boolean;
  status: string;
  notes: string | null;
};

export type HospitalFact = {
  id: string;
  factKey: string;
  category: string;
  value: string;
  status: string;
  version: number;
  evidenceLabel: string | null;
  notes: string | null;
};

export type HospitalBrandClaim = {
  id: string;
  claim: string;
  factStatus: string;
  complianceStatus: string;
  evidenceLabel: string | null;
  notes: string | null;
};

export type HospitalCta = {
  id: string;
  kind: string;
  label: string;
  url: string | null;
  value: string | null;
  priority: number;
  isActive: boolean;
};

export type HospitalWritingPreferences = {
  toneStrategy: "ADAPTIVE" | "FIXED";
  defaultTone: string | null;
  preferredPhrases: string[];
  avoidPhrases: string[];
  notes: string | null;
};

type HospitalListRow = {
  id: string;
  name: string;
  slug: string;
  website_url: string | null;
  is_test: boolean;
  role: HospitalRole;
  profile_status: HospitalProfileStatus;
  source_count: string;
  fact_count: string;
};

type HospitalProfileRow = {
  id: string;
  name: string;
  english_name: string | null;
  slug: string;
  website_url: string | null;
  address: string | null;
  phone: string | null;
  fax: string | null;
  opened_on: string | null;
  summary: string | null;
  philosophy: string | null;
  is_test: boolean;
  profile_status: HospitalProfileStatus;
  profile_version: number;
  role: HospitalRole;
};

type HospitalSourceRow = {
  id: string;
  kind: string;
  label: string;
  url: string | null;
  status: string;
  is_primary: boolean;
  source_date: string | null;
  version_label: string | null;
  content_text: string | null;
  notes: string | null;
};

type HospitalServiceOfferingRow = {
  id: string;
  channel: string;
  title: string;
  detail: string;
  booking_label: string | null;
  sort_order: number;
  status: string;
  source_label: string | null;
};

type HospitalSpecialtyRow = {
  id: string;
  name: string;
  priority: number | null;
  is_marketing_priority: boolean;
  status: string;
  notes: string | null;
};

type HospitalFactRow = {
  id: string;
  fact_key: string;
  category: string;
  value: string;
  status: string;
  version: number;
  evidence_label: string | null;
  notes: string | null;
};

type HospitalBrandClaimRow = {
  id: string;
  claim: string;
  fact_status: string;
  compliance_status: string;
  evidence_label: string | null;
  notes: string | null;
};

type HospitalCtaRow = {
  id: string;
  kind: string;
  label: string;
  url: string | null;
  value: string | null;
  priority: number;
  is_active: boolean;
};

type HospitalWritingPreferencesRow = {
  tone_strategy: "ADAPTIVE" | "FIXED";
  default_tone: string | null;
  preferred_phrases: string[];
  avoid_phrases: string[];
  notes: string | null;
};

function toSlug(value: string) {
  return (
    value
      .normalize("NFKC")
      .trim()
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-+|-+$/g, "") || "hospital"
  );
}

async function findAvailableSlug(
  client: PoolClient,
  name: string,
) {
  const base = toSlug(name);
  let candidate = base;
  let suffix = 2;

  while (true) {
    const exists = await client.query(
      `select 1 from hospitals where slug = $1 limit 1`,
      [candidate],
    );

    if (exists.rowCount === 0) {
      return candidate;
    }

    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
}

function splitCommaOrLine(value: string) {
  return Array.from(
    new Set(
      value
        .split(/[\n,]+/)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

function splitLines(value: string) {
  return Array.from(
    new Set(
      value
        .split(/\n+/)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

function parseBookingServiceLines(value: string) {
  return value
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const separatorIndex = line.indexOf("|");

      return {
        title: (
          separatorIndex < 0
            ? line
            : line.slice(0, separatorIndex)
        ).trim(),
        detail: (
          separatorIndex < 0
            ? ""
            : line.slice(separatorIndex + 1)
        ).trim(),
        sortOrder: index + 1,
      };
    })
    .filter((item) => item.title);
}

async function insertSource(
  client: PoolClient,
  hospitalId: string,
  input: {
    kind: string;
    label: string;
    url?: string | null;
    status?: "CONFIRMED" | "REVIEW_REQUIRED";
    isPrimary?: boolean;
    contentText?: string | null;
    notes?: string | null;
  },
) {
  const result = await client.query<{ id: string }>(
    `
      insert into hospital_sources (
        hospital_id,
        kind,
        label,
        url,
        status,
        is_primary,
        content_text,
        captured_at,
        notes
      )
      values (
        $1,
        $2::hospital_source_kind,
        $3,
        $4,
        $5::hospital_source_status,
        $6,
        $7,
        now(),
        $8
      )
      on conflict (hospital_id, kind, label)
      do update set
        url = excluded.url,
        status = excluded.status,
        is_primary = excluded.is_primary,
        content_text = excluded.content_text,
        captured_at = excluded.captured_at,
        notes = excluded.notes,
        updated_at = now()
      returning id
    `,
    [
      hospitalId,
      input.kind,
      input.label,
      input.url ?? null,
      input.status ?? "CONFIRMED",
      input.isPrimary ?? false,
      input.contentText ?? null,
      input.notes ?? null,
    ],
  );

  return result.rows[0].id;
}

export async function createHospitalProfile(
  userId: string,
  input: CreateHospitalProfileFormInput,
) {
  const client = await dbPool.connect();

  try {
    await client.query("begin");

    const slug = await findAvailableSlug(client, input.name);
    const bookingUrl = normalizeNaverBookingUrl(
      input.naverBookingUrl,
    );

    const hospitalResult = await client.query<{ id: string }>(
      `
        insert into hospitals (
          name,
          english_name,
          slug,
          website_url,
          address,
          phone,
          fax,
          opened_on,
          summary,
          philosophy,
          profile_status,
          created_by
        )
        values (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          nullif($8, '')::date,
          $9,
          $10,
          'DRAFT',
          $11
        )
        returning id
      `,
      [
        input.name,
        input.englishName || null,
        slug,
        normalizeOptionalUrl(input.websiteUrl),
        input.address || null,
        input.phone || null,
        input.fax || null,
        input.openedOn,
        input.summary || null,
        input.philosophy || null,
        userId,
      ],
    );

    const hospitalId = hospitalResult.rows[0].id;

    await client.query(
      `
        insert into hospital_members (
          hospital_id,
          user_id,
          role
        )
        values ($1, $2, 'OWNER')
        on conflict (hospital_id, user_id)
        do update set role = 'OWNER'
      `,
      [hospitalId, userId],
    );

    const sourceInputs = [
      {
        kind: "WEBSITE",
        label: "공식 홈페이지",
        url: normalizeOptionalUrl(input.websiteUrl),
        isPrimary: true,
      },
      {
        kind: "NAVER_BLOG",
        label: "공식 네이버 블로그",
        url: normalizeOptionalUrl(input.officialBlogUrl),
        isPrimary: true,
      },
      {
        kind: "YOUTUBE",
        label: "공식 YouTube",
        url: normalizeOptionalUrl(input.youtubeUrl),
      },
      {
        kind: "INSTAGRAM",
        label: "공식 Instagram",
        url: normalizeOptionalUrl(input.instagramUrl),
      },
      {
        kind: "NAVER_TALK",
        label: "네이버 톡톡",
        url: normalizeOptionalUrl(input.naverTalkUrl),
      },
    ].filter((source) => source.url);

    for (const source of sourceInputs) {
      await insertSource(client, hospitalId, source);
    }

    let bookingSourceId: string | null = null;

    if (bookingUrl || input.bookingIntroText) {
      bookingSourceId = await insertSource(
        client,
        hospitalId,
        {
          kind: "NAVER_BOOKING",
          label: "네이버 예약",
          url: bookingUrl,
          contentText: input.bookingIntroText || null,
          notes:
            "병원이 네이버 예약에 직접 등록한 공식 소개/예약 정보",
        },
      );
    }

    if (input.internalSourceLabel) {
      await insertSource(client, hospitalId, {
        kind: "BRANDBOOK",
        label: input.internalSourceLabel,
        status: input.internalSourceStatus,
        notes:
          input.internalSourceStatus === "CONFIRMED"
            ? "병원에서 현재 기준 공식 확인 완료"
            : "병원 확인 필요",
      });
    }

    for (const [index, specialty] of splitCommaOrLine(
      input.prioritySpecialties,
    ).entries()) {
      await client.query(
        `
          insert into hospital_specialties (
            hospital_id,
            name,
            priority,
            is_marketing_priority,
            status
          )
          values (
            $1,
            $2,
            $3,
            true,
            'CONFIRMED'
          )
          on conflict (hospital_id, name)
          do update set
            priority = excluded.priority,
            is_marketing_priority = true,
            status = excluded.status,
            updated_at = now()
        `,
        [hospitalId, specialty, index + 1],
      );
    }

    for (const service of parseBookingServiceLines(
      input.bookingServiceLines,
    )) {
      await client.query(
        `
          insert into hospital_service_offerings (
            hospital_id,
            source_id,
            channel,
            title,
            detail,
            booking_label,
            sort_order,
            status
          )
          values (
            $1,
            $2,
            'NAVER_BOOKING',
            $3,
            $4,
            '예약하기',
            $5,
            'CONFIRMED'
          )
          on conflict (hospital_id, channel, title)
          do update set
            source_id = excluded.source_id,
            detail = excluded.detail,
            booking_label = excluded.booking_label,
            sort_order = excluded.sort_order,
            status = excluded.status,
            updated_at = now()
        `,
        [
          hospitalId,
          bookingSourceId,
          service.title,
          service.detail,
          service.sortOrder,
        ],
      );
    }

    for (const claim of splitLines(input.brandClaims)) {
      await client.query(
        `
          insert into hospital_brand_claims (
            hospital_id,
            claim,
            fact_status,
            compliance_status,
            notes
          )
          values (
            $1,
            $2,
            'CONFIRMED',
            'UNCHECKED',
            'Writer 전달 전 Compliance 검증 필수'
          )
          on conflict (hospital_id, claim)
          do nothing
        `,
        [hospitalId, claim],
      );
    }

    const ctas = [
      input.phone
        ? {
            kind: "PHONE",
            label: "전화 문의",
            value: input.phone,
            url: null,
            priority: 1,
          }
        : null,
      bookingUrl
        ? {
            kind: "NAVER_BOOKING",
            label: "네이버 예약",
            value: null,
            url: bookingUrl,
            priority: 2,
          }
        : null,
      input.naverTalkUrl
        ? {
            kind: "NAVER_TALK",
            label: "네이버 톡톡",
            value: null,
            url: normalizeOptionalUrl(input.naverTalkUrl),
            priority: 3,
          }
        : null,
    ].filter(Boolean) as Array<{
      kind: string;
      label: string;
      value: string | null;
      url: string | null;
      priority: number;
    }>;

    for (const cta of ctas) {
      await client.query(
        `
          insert into hospital_ctas (
            hospital_id,
            kind,
            label,
            url,
            value,
            priority
          )
          values ($1, $2, $3, $4, $5, $6)
          on conflict (hospital_id, kind, label)
          do update set
            url = excluded.url,
            value = excluded.value,
            priority = excluded.priority,
            is_active = true,
            updated_at = now()
        `,
        [
          hospitalId,
          cta.kind,
          cta.label,
          cta.url,
          cta.value,
          cta.priority,
        ],
      );
    }

    await client.query(
      `
        insert into hospital_writing_preferences (
          hospital_id,
          tone_strategy,
          notes
        )
        values (
          $1,
          'ADAPTIVE',
          '고정 Tone을 강제하지 않고 프로젝트별 상위 문서 분석으로 Tone을 추천한다.'
        )
        on conflict (hospital_id)
        do nothing
      `,
      [hospitalId],
    );

    await client.query("commit");
    return hospitalId;
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

export async function listHospitalsForUser(
  userId: string,
): Promise<HospitalMembershipListItem[]> {
  const result = await dbPool.query<HospitalListRow>(
    `
      select
        h.id,
        h.name,
        h.slug,
        h.website_url,
        h.is_test,
        h.profile_status,
        hm.role,
        (
          select count(*)::text
          from hospital_sources hs
          where hs.hospital_id = h.id
            and hs.status <> 'DISABLED'
        ) as source_count,
        (
          select count(*)::text
          from hospital_facts hf
          where hf.hospital_id = h.id
            and hf.is_current = true
        ) as fact_count
      from hospital_members hm
      join hospitals h
        on h.id = hm.hospital_id
      where hm.user_id = $1
        and h.archived_at is null
      order by h.created_at desc
    `,
    [userId],
  );

  return result.rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    websiteUrl: row.website_url,
    isTest: row.is_test,
    role: row.role,
    profileStatus: row.profile_status,
    sourceCount: Number(row.source_count),
    factCount: Number(row.fact_count),
  }));
}

export async function getHospitalProfileForUser(
  userId: string,
  hospitalId: string,
): Promise<HospitalProfileDetails | null> {
  const hospitalResult =
    await dbPool.query<HospitalProfileRow>(
      `
        select
          h.id,
          h.name,
          h.english_name,
          h.slug,
          h.website_url,
          h.address,
          h.phone,
          h.fax,
          h.opened_on::text,
          h.summary,
          h.philosophy,
          h.is_test,
          h.profile_status,
          h.profile_version,
          hm.role
        from hospitals h
        join hospital_members hm
          on hm.hospital_id = h.id
         and hm.user_id = $2
        where h.id = $1
          and h.archived_at is null
        limit 1
      `,
      [hospitalId, userId],
    );

  const hospital = hospitalResult.rows[0];

  if (!hospital) {
    return null;
  }

  const [
    sourceResult,
    serviceResult,
    specialtyResult,
    factResult,
    claimResult,
    ctaResult,
    writingResult,
  ] = await Promise.all([
    dbPool.query<HospitalSourceRow>(
      `
        select
          id,
          kind::text,
          label,
          url,
          status::text,
          is_primary,
          source_date::text,
          version_label,
          content_text,
          notes
        from hospital_sources
        where hospital_id = $1
        order by is_primary desc, created_at asc
      `,
      [hospitalId],
    ),
    dbPool.query<HospitalServiceOfferingRow>(
      `
        select
          hso.id,
          hso.channel,
          hso.title,
          hso.detail,
          hso.booking_label,
          hso.sort_order,
          hso.status::text,
          hs.label as source_label
        from hospital_service_offerings hso
        left join hospital_sources hs
          on hs.id = hso.source_id
        where hso.hospital_id = $1
        order by
          hso.channel,
          hso.sort_order,
          hso.title
      `,
      [hospitalId],
    ),
    dbPool.query<HospitalSpecialtyRow>(
      `
        select
          id,
          name,
          priority,
          is_marketing_priority,
          status::text,
          notes
        from hospital_specialties
        where hospital_id = $1
        order by priority nulls last, name
      `,
      [hospitalId],
    ),
    dbPool.query<HospitalFactRow>(
      `
        select
          hf.id,
          hf.fact_key,
          hf.category,
          hf.value,
          hf.status::text,
          hf.version,
          hs.label as evidence_label,
          hf.notes
        from hospital_facts hf
        left join hospital_sources hs
          on hs.id = hf.evidence_source_id
        where hf.hospital_id = $1
          and hf.is_current = true
        order by hf.category, hf.fact_key
      `,
      [hospitalId],
    ),
    dbPool.query<HospitalBrandClaimRow>(
      `
        select
          hbc.id,
          hbc.claim,
          hbc.fact_status::text,
          hbc.compliance_status::text,
          hs.label as evidence_label,
          hbc.notes
        from hospital_brand_claims hbc
        left join hospital_sources hs
          on hs.id = hbc.evidence_source_id
        where hbc.hospital_id = $1
        order by hbc.created_at
      `,
      [hospitalId],
    ),
    dbPool.query<HospitalCtaRow>(
      `
        select
          id,
          kind,
          label,
          url,
          value,
          priority,
          is_active
        from hospital_ctas
        where hospital_id = $1
        order by priority, created_at
      `,
      [hospitalId],
    ),
    dbPool.query<HospitalWritingPreferencesRow>(
      `
        select
          tone_strategy,
          default_tone,
          preferred_phrases,
          avoid_phrases,
          notes
        from hospital_writing_preferences
        where hospital_id = $1
        limit 1
      `,
      [hospitalId],
    ),
  ]);

  const writingRow = writingResult.rows[0];

  return {
    id: hospital.id,
    name: hospital.name,
    englishName: hospital.english_name,
    slug: hospital.slug,
    websiteUrl: hospital.website_url,
    address: hospital.address,
    phone: hospital.phone,
    fax: hospital.fax,
    openedOn: hospital.opened_on,
    summary: hospital.summary,
    philosophy: hospital.philosophy,
    isTest: hospital.is_test,
    role: hospital.role,
    profileStatus: hospital.profile_status,
    profileVersion: hospital.profile_version,
    sources: sourceResult.rows.map((row) => ({
      id: row.id,
      kind: row.kind,
      label: row.label,
      url: row.url,
      status: row.status,
      isPrimary: row.is_primary,
      sourceDate: row.source_date,
      versionLabel: row.version_label,
      contentText: row.content_text,
      notes: row.notes,
    })),
    serviceOfferings: serviceResult.rows.map(
      (row) => ({
        id: row.id,
        channel: row.channel,
        title: row.title,
        detail: row.detail,
        bookingLabel: row.booking_label,
        sortOrder: row.sort_order,
        status: row.status,
        sourceLabel: row.source_label,
      }),
    ),
    specialties: specialtyResult.rows.map((row) => ({
      id: row.id,
      name: row.name,
      priority: row.priority,
      isMarketingPriority: row.is_marketing_priority,
      status: row.status,
      notes: row.notes,
    })),
    facts: factResult.rows.map((row) => ({
      id: row.id,
      factKey: row.fact_key,
      category: row.category,
      value: row.value,
      status: row.status,
      version: row.version,
      evidenceLabel: row.evidence_label,
      notes: row.notes,
    })),
    brandClaims: claimResult.rows.map((row) => ({
      id: row.id,
      claim: row.claim,
      factStatus: row.fact_status,
      complianceStatus: row.compliance_status,
      evidenceLabel: row.evidence_label,
      notes: row.notes,
    })),
    ctas: ctaResult.rows.map((row) => ({
      id: row.id,
      kind: row.kind,
      label: row.label,
      url: row.url,
      value: row.value,
      priority: row.priority,
      isActive: row.is_active,
    })),
    writingPreferences: writingRow
      ? {
          toneStrategy: writingRow.tone_strategy,
          defaultTone: writingRow.default_tone,
          preferredPhrases:
            writingRow.preferred_phrases ?? [],
          avoidPhrases: writingRow.avoid_phrases ?? [],
          notes: writingRow.notes,
        }
      : null,
  };
}
