import type { PoolClient } from "pg";
import { dbPool } from "@/lib/db/pool";
import type { DevicePreference } from "@/lib/product/types";
import type { WorkflowStage } from "@/lib/workflow/state";
import {
  parseSecondaryKeywords,
  type CreateContentProjectFormInput,
} from "@/lib/projects/schema";

export type ProjectStatus = "ACTIVE" | "ARCHIVED";

export type ContentProjectListItem = {
  id: string;
  hospitalId: string;
  hospitalName: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  devicePreference: DevicePreference;
  workflowStage: WorkflowStage;
  status: ProjectStatus;
  createdAt: string;
};

export type ContentProjectDetails =
  ContentProjectListItem & {
    hospitalRole: "OWNER" | "EDITOR" | "VIEWER";
    hospitalProfileStatus: "DRAFT" | "ACTIVE" | "ARCHIVED";
  };

type EditableHospitalMembershipRow = {
  role: "OWNER" | "EDITOR" | "VIEWER";
  archived_at: string | null;
};

type ProjectListRow = {
  id: string;
  hospital_id: string;
  hospital_name: string;
  primary_keyword: string;
  secondary_keywords: string[];
  device_preference: DevicePreference;
  workflow_stage: WorkflowStage;
  status: ProjectStatus;
  created_at: string;
};

type ProjectDetailsRow = ProjectListRow & {
  hospital_role: "OWNER" | "EDITOR" | "VIEWER";
  hospital_profile_status: "DRAFT" | "ACTIVE" | "ARCHIVED";
};

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

async function assertHospitalCanCreateProject(
  client: PoolClient,
  userId: string,
  hospitalId: string,
) {
  const result =
    await client.query<EditableHospitalMembershipRow>(
      `
        select
          hm.role,
          h.archived_at::text
        from hospital_members hm
        join hospitals h
          on h.id = hm.hospital_id
        where hm.user_id = $1
          and hm.hospital_id = $2
        limit 1
      `,
      [userId, hospitalId],
    );

  const membership = result.rows[0];

  if (
    !membership ||
    membership.archived_at ||
    !["OWNER", "EDITOR"].includes(membership.role)
  ) {
    throw new Error("PROJECT_CREATE_FORBIDDEN");
  }
}

export async function createContentProject(
  userId: string,
  input: CreateContentProjectFormInput,
) {
  const client = await dbPool.connect();

  try {
    await client.query("begin");

    await assertHospitalCanCreateProject(
      client,
      userId,
      input.hospitalId,
    );

    const secondaryKeywords = parseSecondaryKeywords(
      input.secondaryKeywords,
      input.primaryKeyword,
    );

    const result = await client.query<{ id: string }>(
      `
        insert into content_projects (
          hospital_id,
          created_by,
          primary_keyword,
          secondary_keywords,
          device_preference,
          workflow_stage,
          status
        )
        values (
          $1,
          $2,
          $3,
          $4::text[],
          $5,
          'SERP',
          'ACTIVE'
        )
        returning id
      `,
      [
        input.hospitalId,
        userId,
        input.primaryKeyword.trim(),
        secondaryKeywords,
        input.devicePreference,
      ],
    );

    await client.query("commit");

    return result.rows[0].id;
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

export async function listContentProjectsForUser(
  userId: string,
): Promise<ContentProjectListItem[]> {
  const result = await dbPool.query<ProjectListRow>(
    `
      select
        cp.id,
        cp.hospital_id,
        h.name as hospital_name,
        cp.primary_keyword,
        cp.secondary_keywords,
        cp.device_preference,
        cp.workflow_stage,
        cp.status,
        cp.created_at::text
      from content_projects cp
      join hospitals h
        on h.id = cp.hospital_id
      join hospital_members hm
        on hm.hospital_id = cp.hospital_id
       and hm.user_id = $1
      where cp.status = 'ACTIVE'
        and h.archived_at is null
      order by cp.created_at desc
    `,
    [userId],
  );

  return result.rows.map((row) => ({
    id: row.id,
    hospitalId: row.hospital_id,
    hospitalName: row.hospital_name,
    primaryKeyword: row.primary_keyword,
    secondaryKeywords: row.secondary_keywords ?? [],
    devicePreference: row.device_preference,
    workflowStage: row.workflow_stage,
    status: row.status,
    createdAt: row.created_at,
  }));
}

export async function getContentProjectForUser(
  userId: string,
  projectId: string,
): Promise<ContentProjectDetails | null> {
  if (!isUuid(projectId)) {
    return null;
  }

  const result = await dbPool.query<ProjectDetailsRow>(
    `
      select
        cp.id,
        cp.hospital_id,
        h.name as hospital_name,
        cp.primary_keyword,
        cp.secondary_keywords,
        cp.device_preference,
        cp.workflow_stage,
        cp.status,
        cp.created_at::text,
        hm.role as hospital_role,
        h.profile_status as hospital_profile_status
      from content_projects cp
      join hospitals h
        on h.id = cp.hospital_id
      join hospital_members hm
        on hm.hospital_id = cp.hospital_id
       and hm.user_id = $1
      where cp.id = $2
        and h.archived_at is null
      limit 1
    `,
    [userId, projectId],
  );

  const row = result.rows[0];

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    hospitalId: row.hospital_id,
    hospitalName: row.hospital_name,
    primaryKeyword: row.primary_keyword,
    secondaryKeywords: row.secondary_keywords ?? [],
    devicePreference: row.device_preference,
    workflowStage: row.workflow_stage,
    status: row.status,
    createdAt: row.created_at,
    hospitalRole: row.hospital_role,
    hospitalProfileStatus: row.hospital_profile_status,
  };
}
